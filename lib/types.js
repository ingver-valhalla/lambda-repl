import { isOneOf } from './utils';

export const specChars = ['\\', '.', '(', ')', '='];

export const specFns = ['let'];

export const isSpecial = (str) => {
    return typeof str === 'string' &&
           isOneOf(str, specChars);
};

export const isName = (str) => {
    return str && typeof str === 'string' && isNaN(str[0]) &&
           !isNum(str) && !specChars.some((c) => str.includes(c));
};

export const isNum = (str) => {
    return str && typeof str === 'string' &&
           !isNaN(Number(str));
};

export const isGroup = (obj) =>
    Array.isArray(obj);

const atomTypes = [isNum, isName];

export const isAtom = (obj) =>
    atomTypes.some((type) => type(obj));
