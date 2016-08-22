import { SyntaxError, RuntimeError } from './errors';
import { isName, isGroup, isAtom } from './types';
import { print } from './utils';
import Env from './env';

const rename = (ast, target, to) => {
    const helper = (ast) => {
        if (isGroup(ast))
            return ast.map((el) => helper(el));
        else
            return ast === target ? to : ast
    };
    return helper(ast);
};

export const substitute = (ast, env, bound = []) => {
    if (ast[0] === '\\') {
        let newBound = Array.from(bound);
        newBound.push(ast[1]);

        let ret = substitute(ast[2], env, newBound);
        if (ret instanceof RuntimeError)
            return ret;
        if (isAtom(ret))
            ret = [ret];
        const newAst = ['\\', ast[1], ret];
        return newAst;
    }
    else if (isGroup(ast)) {
        let newAst = [];

        // preeval
        for (let i = 0; i < ast.length; ++i) {
            const ret = substitute(ast[i], env, bound);
            if (ret instanceof RuntimeError)
                return ret;
            newAst.push(ret);
        }

        // apply
        if (isGroup(newAst[0]) && newAst[0][0] === '\\') {
            const [fn, ...args] = newAst;
            let ret = args.reduce((fn, arg) => {
                if (fn instanceof RuntimeError)
                    return fn;
                if (isGroup(fn) && fn[0] === '\\') {
                    const variable = fn[1] === arg ? fn[1] + "'" : fn[1];
                    const subEnv = new Env(env);
                    subEnv.set(variable, arg);

                    const subBound = bound.filter((el) => el !== fn[1]);
                    const body = (isName(arg)) ?
                        rename(fn[2], arg, arg + "'") : fn[2];

                    const ret = substitute(body, subEnv, subBound);
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
        return newAst;
    }
    else if (isName(ast)) {
        if (bound.includes(ast))
            return ast;
        const val = env.find(ast);
        const ret = val ? val : new RuntimeError("undefined variable " + ast);
        return ret;
    }
    else {
        return ast;
    };
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
    return astToString(ret);
};
