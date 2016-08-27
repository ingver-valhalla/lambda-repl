import { SyntaxError, RuntimeError } from './errors';
import { isName, isGroup, isAtom, isNum } from './types';
import Env from './env';
import * as int from './integer';
import { shallowCopy } from './utils';

const isLambda = (ast) => isGroup(ast) && ast[0] === '\\';

const simpleRename = (ast, target, to) => {
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

const getNewVarName = (old, used) => {
    let newName = old + "'";
    while (newName in used)
        newName = newName + "'";
    return newName;
};

const getVariables = (ast, used = {}) => {
    let vars = shallowCopy(used);

    const iter = (ast) => {
        if (isLambda(ast)) {
            vars[ast[1]] = true;
            return iter(ast[2]);
        }
        else {
            return vars;
        }
    };

    return iter(ast, vars);
};

export const substitute = (ast, env, used = {}) => {
    if (isLambda(ast)) {
        let variable, body;
        if (ast[1] in used) {
            variable = getNewVarName(ast[1], used);
            body = simpleRename(ast[2], ast[1], variable);
        }
        else {
            variable = ast[1];
            body = ast[2];
        }

        let subEnv = new Env(env);
        subEnv.set(variable, variable);
        let newUsed = shallowCopy(used);
        newUsed[variable] = true;

        let newBody = substitute(body, subEnv, newUsed);
        if (newBody instanceof RuntimeError)
            return newBody;
        if (isAtom(newBody))
            newBody = [newBody];
        const newAst = ['\\', variable, newBody];
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
        if (isLambda(newAst[0])) {
            const [fn, ...args] = newAst;

            // apply fn to all args from left
            let ret = args.reduce((fn, arg) => {
                if (fn instanceof RuntimeError)
                    return fn;
                if (!isLambda(fn)) {
                    return [fn, arg];
                }

                const variable = fn[1];
                const body = fn[2];
                let newArg;

                if (isLambda(arg)) {
                    // rename all variables in arg that presents in fn
                    const usedInFn = getVariables(fn, used);
                    newArg = substitute(arg, env, usedInFn);
                }
                else {
                    newArg = arg;
                }

                // extend env
                let subEnv = new Env(env);
                subEnv.set(variable, newArg);

                let newUsed = shallowCopy(used);
                newUsed[variable] = true;

                const ret = substitute(body, subEnv, newUsed);
                return ret;
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
