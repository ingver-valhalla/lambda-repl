import * as types from './types';
import { isOneOf, last, wrap } from './utils';
import { syntaxError, isSyntaxError } from './errors';

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
    return syntaxError(msg);
};


// breaks up string on tokens
export const tokenize = (expr) => {
    expr = expr.replace(/λ/g, '\\');

    return patterns.reduce((e, p) => {
            return e.replace(p, (f) => wrap(f, ' '))
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
        const {result, tail} = group(tokens, []);
        if (isSyntaxError(result))
            return result;
        if (result.includes(')'))
            return syntaxError("Unexpected `)'");
        return result;
    }

    const [first, ...rest] = tokens;

    if (first === '(') {
        const ret = group(rest, []);
        const {result, tail} = ret;

        if (isSyntaxError(result))
            return ret;

        if (last(result) !== ')') {
            const err = {
                result: syntaxError("Missing `)'"),
                tail: []
            };
            return err;
        }

        result.pop();
        if (result.length === 0) {
            const err = {
                result: syntaxError("Parenthesis group nothing"),
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
    if (tokens === undefined
        || !Array.isArray(tokens)) {
        new Error('tokens must be an array of strings');
    }

    if (tokens.length === 0) {
        return [];
    }

    const grouped = group(tokens);
    if (isSyntaxError(grouped))
        return grouped;

    const [first, ...rest] = grouped;

    // `let' form
    if (first === 'let') {
        const [varName, equalSign, ...def] = rest;

        if (!types.isName(varName))
            return expectedErr("variable after let", varName);

        if (equalSign !== '=')
            return expectedErr("equal sign after `" + varName + "'", equalSign);

        if (def.length === 0)
            return expectedErr("definition for variable `" + varName + "'");

        if (isOneOf(def[0], types.specFns))
            return syntaxError('Unexpected token ' + def[0]);

        const parsedDef = parse(def);
        if (isSyntaxError(parsedDef))
            return parsedDef;

        const ret = [first, varName, parsedDef]; // exlude `='
        return ret;
    }
    // lambda expression
    else if (first === '\\') {
        const [varName, dot, ...body] = rest;

        if (isOneOf(varName, types.specFns))
            return syntaxErr("name `let' is forbidden");

        if (!types.isName(varName))
            return expectedErr("variable after λ", varName);

        if (dot !== '.')
            return expectedErr("dot", dot);

        if (isOneOf(body[0], types.specFns))
            return syntaxError('Unexpected token ' + body[0]);

        const parsedBody = parse(body);
        if (isSyntaxError(parsedBody))
            return parsedBody;

        const ret = [first, varName, parsedBody]; // exclude dot
        return ret;
    }
    else if (types.isGroup(first)) {
        if (first.length !== 0
            && isOneOf(first[0], types.specFns))
            return syntaxError('Unexpected token ' + first[0]);

        const ret1 = parse(first);
        if (isSyntaxError(ret1))
            return ret1;

        if (rest.length === 0) {
            const ret = [ret1];
            return ret;
        }
        if (isOneOf(rest[0], types.specFns))
            return syntaxError('Unexpected token ' + rest[0]);

        const ret2 = parse(rest);
        if (isSyntaxError(ret2))
            return ret2;

        const ret = [ret1].concat(ret2);
        return ret;
    }
    // application
    else if (types.isName(first)) {
        if (rest.length > 0) {
            if (types.isSpecial(rest[0]) || isOneOf(rest[0], types.specFns)) {
                return syntaxError("Unexpected token " + rest[0]);
            }
            const parsedRest = parse(rest);
            if (isSyntaxError(parsedRest))
                return parsedRest;

            const ret = [first].concat(parsedRest);
            return ret;
        }
        const ret = [first];
        return ret;
    }
    // error
    else {
        return syntaxError("Unexpected token " + first);
    }
};
