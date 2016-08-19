import { isOneOf } from './utils';

export const specChars = ['\\', '.', '(', ')', '='];

export const specFns = ['let'];

export const isSpecial = (str) => {
    return typeof str === 'string'
        && isOneOf(str, specChars);
};

export const isName = (str) => {
    return str !== undefined
        && typeof str === 'string'
        && !specChars.some((c) => str.includes(c));
}

export const isGroup = (obj) =>
    Array.isArray(obj);

export const isAtom = (obj) =>
    !isGroup(obj);
