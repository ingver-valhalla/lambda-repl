import { isNum } from './types';
import { RuntimeError } from './errors';

export const plus = (args) => {
    if (args.length < 2 ||
        !args.every((x) => isNum(x)))
        return new RuntimeError("+ takes two or more integers");

    return args.reduce((sum, num) => {
        return sum + num;
    }, 0);
};

export const plusOne = (args) => {
    if (args.length !== 1 || !isNum(args[0]))
        return new RuntimeError("1+ takes only one integer");

    return args[0] + 1;
};

const intFnsMap = {
    "+": plus,
    "1+": plusOne
};

export const isIntFn = (str) => intFnsMap.hasOwnProperty(str);

export const handleIntFn = (ast) => {
    const [fn, ...args] = ast;
    return intFnsMap[fn](args);
};
