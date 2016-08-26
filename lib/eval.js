import { SyntaxError, RuntimeError } from './errors';
import { isName, isGroup, isAtom, isNum } from './types';
import Env from './env';
import * as int from './integer';

const rename = (ast, target, to) => {
    if (typeof target !== 'string' ||
        typeof to !== 'string')
        return;
    const helper = (ast) => {
        if (isGroup(ast))
            return ast.map((el) => helper(el));
        else
            return ast === target ? to : ast;
    };
    return helper(ast);
};

export const substitute = (ast, env, used = {}) => {
    if (ast[0] === '\\') {
        let variable, body;
        if (used[ast[1]]) {
            variable = ast[1] + "'";
            body = rename(ast[2], ast[1], variable);
        }
        else {
            variable = ast[1];
            body = ast[2];
            used[variable] = true;
        }

        let subEnv = new Env(env);
        subEnv.set(variable, variable);

        let ret = substitute(body, subEnv, used);
        if (ret instanceof RuntimeError)
            return ret;
        if (isAtom(ret))
            ret = [ret];
        const newAst = ['\\', variable, ret];
        return newAst;
    }
    else if (isGroup(ast)) {
        let newAst = [];

        // preeval
        for (let i = 0; i < ast.length; ++i) {
            const ret = substitute(ast[i], env, used);
            if (ret instanceof RuntimeError)
                return ret;
            newAst.push(ret);
        }

        if (int.isIntFn(newAst[0])) {
            const [, ...args] = newAst;
            if (args.every((x) => isNum(x)))
                return int.handleIntFn(newAst);
            else
                return newAst;
        }

        // apply
        if (isGroup(newAst[0]) && newAst[0][0] === '\\') {
            const [fn, ...args] = newAst;
            let ret = args.reduce((fn, arg) => {
                if (fn instanceof RuntimeError)
                    return fn;
                if (isGroup(fn) && fn[0] === '\\') {
                    let variable, body;
                    if (used[fn[1]]) {
                        variable = fn[1] + "'";
                        body = rename(fn[2], fn[1], variable);
                    }
                    else {
                        variable = fn[1];
                        body = fn[2];
                        used[variable] = true;
                    }
                    const subEnv = new Env(env);
                    subEnv.set(variable, arg);

                    const ret = substitute(body, subEnv, used);
                    return ret;
                }
                else {
                    return new RuntimeError("can't apply non-lambda");
                }
            }, fn);
            if (isGroup(ret) && ret.length === 1)
                ret = ret[0];
            return ret;
        }
        else if (newAst.length > 1 && isAtom(newAst[0])) {
            return new RuntimeError("can't apply an atom");
        }
        else {
            return newAst;
        }
    }
    else if (int.isIntFn(ast)) {
        return ast;
    }
    else if (isName(ast)) {
        const val = env.find(ast);
        const ret = val !== null ? val : new RuntimeError("undefined variable " + ast);
        return ret;
    }
    else {
        return ast;
    }
};

export const astToString = (ast) => {
    if (isGroup(ast)) {
        if (ast[0] === '\\') {
            return 'λ' + ast[1] + '.' + astToString(ast[2]);
        }
        else {
            let result;
            result = ast.map((el) => {
                if (isGroup(el)) {
                    return '(' + astToString(el) + ')';
                }
                else {
                    return el;
                }
            });
            return result.join(' ');
        }
    }
    else {
        return ast;
    }
};

export const evalAst = (ast, env = new Env()) => {
    if (ast instanceof SyntaxError)
        return ast;

    if (ast[0] === 'let') {
        const ret = substitute(ast[2], env);
        if (ret instanceof RuntimeError)
            return ret;
        env.set(ast[1], ret);
        return astToString(ret);
    }

    const ret = substitute(ast, env);

    if (isGroup(ret) && int.isIntFn(ret[0]))
        return int.handleIntFn(ret);

    return astToString(ret);
};
