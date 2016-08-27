import * as types from './types';
import { isOneOf, last, wrap } from './utils';
import { SyntaxError } from './errors';
import { isIntFn } from './integer';

const patterns = [
    /\\/g, // slash (lambda analogue)
    /\./g, // dot (abstraction)
    /\(/g, // left paren
    /\)/g, // right paren
    /=/g   // equal sign
];


// generates syntax error of expected token
const expectedErr = (exp, got) => {
    let msg = "Expected " + exp + ".";
    if (got) {
        msg += " Instead got " + (types.isGroup(got) ? '(' : got);
    }
    return new SyntaxError(msg);
};


// breaks up string on tokens
export const tokenize = (expr) => {
    expr = expr.replace(/λ/g, '\\');

    return patterns.reduce((e, p) => {
            return e.replace(p, (f) => wrap(f, ' '));
        }, expr)
        .split(' ')
        .filter((s) => s !== '');
};


// groups tokens by parenthesis
export const group = (tokens, acc) => {
    if (tokens === undefined) {
        return [];
    }

    if (acc === undefined) {
        const {result, } = group(tokens, []);
        if (result instanceof SyntaxError)
            return result;
        if (result.includes(')'))
            return new SyntaxError("Unexpected `)'");
        return result;
    }

    const [first, ...rest] = tokens;

    if (first === '(') {
        const ret = group(rest, []);
        const {result, tail} = ret;

        if (result instanceof SyntaxError)
            return ret;

        if (last(result) !== ')') {
            const err = {
                result: new SyntaxError("Missing `)'"),
                tail: []
            };
            return err;
        }

        result.pop();
        if (result.length === 0) {
            const err = {
                result: new SyntaxError("Parenthesis group nothing"),
                tail: []
            };
            return err;
        }
        acc.push(result);

        if (tail.length > 0) {
            return group(tail, acc);
        }

        const res = { result: acc, tail: tail };
        return res;
    }
    else if (first === ')') {
        acc.push(first);
        return { result: acc, tail: rest };
    }
    else if (first) {
        acc.push(first);
        return group(rest, acc);
    }
    else {
        return {result: acc, tail: []};
    }
};


// handles an array of tokens
export const parse = (tokens) => {
    if (tokens === undefined ||
        !Array.isArray(tokens)) {
        new Error('tokens must be an array of strings');
    }

    if (tokens.length === 0) {
        return [];
    }

    const grouped = group(tokens);
    if (grouped instanceof SyntaxError)
        return grouped;

    const [first, ...rest] = grouped;

    // `let' form
    if (first === 'let') {
        const [varName, equalSign, ...def] = rest;

        if (varName === 'let')
            return new SyntaxError("`let' as variable name is forbidden");
        if (isIntFn(varName))
            return new SyntaxError("can't override builtin function (" + varName + ")");

        if (!types.isName(varName))
            return expectedErr("variable after let", varName);

        if (equalSign !== '=')
            return expectedErr("equal sign after `" + varName + "'", equalSign);

        if (def.length === 0)
            return expectedErr("definition for variable `" + varName + "'");

        if (isOneOf(def[0], types.specFns))
            return new SyntaxError('Unexpected token ' + def[0]);

        const parsedDef = parse(def);
        if (parsedDef instanceof SyntaxError)
            return parsedDef;

        const ret = [first, varName, parsedDef]; // exlude `='
        return ret;
    }
    // lambda expression
    else if (first === '\\') {
        const [varName, dot, ...body] = rest;

        if (isOneOf(varName, types.specFns))
            return new SyntaxError("name `let' is forbidden");

        if (!types.isName(varName))
            return expectedErr("variable after λ", varName);

        if (dot !== '.')
            return expectedErr("dot", dot);

        if (isOneOf(body[0], types.specFns))
            return new SyntaxError('Unexpected token ' + body[0]);

        const parsedBody = parse(body);
        if (parsedBody instanceof SyntaxError)
            return parsedBody;
        if (parsedBody.length === 0)
            return new SyntaxError("lambda can't have an empty body");

        const ret = [first, varName, parsedBody]; // exclude dot
        return ret;
    }
    else if (types.isGroup(first)) {
        if (first.length !== 0 &&
            isOneOf(first[0], types.specFns))
            return new SyntaxError('Unexpected token ' + first[0]);

        const ret1 = parse(first);
        if (ret1 instanceof SyntaxError)
            return ret1;

        if (rest.length === 0) {
            const ret = [ret1];
            return ret;
        }
        if (isOneOf(rest[0], types.specFns))
            return new SyntaxError('Unexpected token ' + rest[0]);

        const ret2 = parse(rest);
        if (ret2 instanceof SyntaxError)
            return ret2;

        const ret = [ret1].concat(ret2);
        return ret;
    }
    else if (isIntFn(first)) {
        const ret = parse(rest);
        if (ret instanceof SyntaxError)
            return ret;

        return [first].concat(ret);
    }
    // application
    else if (types.isName(first)) {
        if (rest.length > 0) {
            if (types.isSpecial(rest[0]) || isOneOf(rest[0], types.specFns)) {
                return new SyntaxError("Unexpected token " + rest[0]);
            }
            const parsedRest = parse(rest);
            if (parsedRest instanceof SyntaxError)
                return parsedRest;

            const ret = [first].concat(parsedRest);
            return ret;
        }
        const ret = [first];
        return ret;
    }
    // number
    else if (types.isNum(first)) {
        const ret = parse(rest);
        if (ret instanceof SyntaxError)
            return ret;

        return [Number(first)].concat(ret);
    }
    // error
    else {
        return new SyntaxError("Unexpected token " + first);
    }
};
