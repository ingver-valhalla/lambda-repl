import { isOneOf } from './utils';
import { isIntFn } from './integer';

export const specChars = ['\\', '.', '(', ')', '='];

export const specFns = ['let'];

export const isSpecial = (str) => {
    return typeof str === 'string' &&
           isOneOf(str, specChars);
};

export const isName = (str) => {
    return str && typeof str === 'string' &&
           !isNum(str) && !specChars.some((c) => str.includes(c));
};

export const isNum = (obj) => {
    return obj !== undefined && obj !== null &&
           !isIntFn(obj) && !isNaN(Number(obj));
};

export const isGroup = (obj) =>
    Array.isArray(obj);

const atomTypes = [isNum];

export const isAtom = (obj) =>
    atomTypes.some((type) => type(obj));
