const specChars = ['\\', '.', '(', ')'];

const patterns = [
    /\\/g, // slash (lambda analogue)
    /\./g, // dot (abstraction)
    /\(/g, // left paren
    /\)/g  // right paren
];

const last = (arr) => {
    return arr[arr.length - 1];
};

const wrap = (str, w) => w + str + w;

const isSpecial = (str) => {
    return typeof str === 'string'
        && specChars.some((c) => str.includes(c));
};

const isName = (str) => {
    return str !== undefined
        && typeof str === 'string'
        && !isSpecial(str);
}

const isGroup = (obj) => Array.isArray(obj);

const isAtom = (obj) => {
    return !isGroup(obj);
};


const log = console.log;

export const tokenize = (expr) => {
    expr = expr.replace(/λ/g, '\\');

    return patterns.reduce((e, p) => {
            return e.replace(p, (f) => wrap(f, ' '))
        }, expr)
        .split(' ')
        .filter((s) => s !== '');
};

const syntaxError = (msg) => {
    return {
        err: "SyntaxError",
        msg: msg
    };
};

const isSyntaxError = (obj) => {
    return obj && obj.hasOwnProperty('err')
        && obj.err === "SyntaxError"
        && obj.hasOwnProperty('msg');
};

const expectedErr = (exp, got) => {
    let msg = "Expected " + exp;
    if (got) {
        msg += " Instead got " + isGroup(got) ? '(' : got;
    }
    return syntaxError(msg);
};

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
        if (tail.length > 0)
            return syntaxError("Unexpected token " + tail[0]);
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

export const parse = (tokens) => {
    if (tokens === undefined
        || !Array.isArray(tokens)) {
        new Error('tokens must be an array of strings');
    }

    if (tokens.length === 0) {
        return [];
    }

    const grouped = group(tokens);

    const [first, ...rest] = grouped;

    // lambda expression
    if (first === '\\') {
        const [varName, dot, ...body] = rest;

        if (!isName(varName))
            return expectedErr("variable", varName);

        console.log('dot', dot);
        if (dot !== '.')
            return expectedErr("dot", dot);

        const parsedBody = parse(body);
        if (isSyntaxError(parsedBody))
            return parsedBody;

        const ret = [first, varName, parsedBody]; // exclude dot
        return ret;
    }
    else if (isGroup(first)) {
        const ret1 = parse(first);
        if (isSyntaxError(ret1))
            return ret1;

        if (rest.length === 0) {
            const ret = [ret1];
            return ret;
        }

        const ret2 = parse(rest);
        if (isSyntaxError(ret2))
            return ret2;

        const ret = [ret1].concat(ret2);
        return ret;
    }
    // application
    else if (isName(first)) {
        if (rest.length > 0) {
            if (isSpecial(rest[0])) {
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
