import { RuntimeError } from './errors';
import { isGroup } from './types';
import { print } from './utils';

export const substitute = (ast, env, bound = []) => {
    if (ast[0] === '\\') {
        const newBound = Array.from(bound);
        newBound.push(ast[1]);
        const ret = substitute(ast[2], env, newBound);
        if (ret instanceof RuntimeError)
            return ret;
        return ['\\', ast[1], ret];
    }
    else {
        const newAst = [];
        ast.forEach((el) => {
            if (isGroup(el)) {
                const ret = substitute(el, env, bound);
                if (ret instanceof RuntimeError)
                    return ret;
                newAst.push(ret);
            }
            else if (!bound.includes(el)) {
                const val = env[el];
                if (!val)
                    return new RuntimeError("undefined variable " + el);
                newAst.push(val);
            }
            else {
                newAst.push(el);
            }
        });
        return newAst;
    }
};

export const evalAst = (ast, env) => {
    if (ast[0] === 'let') {
        const ret = substitute(ast[2], env);
        if (ret instanceof RuntimeError)
            return ret;
        env[ast[1]] = ret;
        return ret;
    }
    else {
        return substitute(ast, env, []);
    }
};
