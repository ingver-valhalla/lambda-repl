import { SyntaxError, RuntimeError } from './errors';
import { isName, isGroup, isAtom } from './types';
import { print } from './utils';
import Env from './env';


export const substitute = (ast, env, bound = []) => {
    if (ast[0] === '\\') {
        let newBound = Array.from(bound);
        newBound.push(ast[1]);

        let ret = substitute(ast[2], env, newBound);
        if (ret instanceof RuntimeError)
            return ret;
        if (isGroup(ret) && ret.length === 1 && ret[0][0] === '\\')
            ret = ret[0];
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

        // if no bound vars -- can apply
        if (bound.length === 0) {
            const [fn, ...args] = newAst;
            const ret = args.reduce((fn, arg) => {
                if (fn instanceof RuntimeError)
                    return fn;
                if (isGroup(fn) && fn[0] === '\\') {
                    const subEnv = new Env(env);
                    subEnv.set(fn[1], arg);
                    const ret = substitute(fn[2], subEnv);
                    return ret;
                }
                else {
                    return new RuntimeError("can't apply non-lambda");
                }
            }, fn);
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

const astToString = (ast) => {
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
