import { inspect } from 'util';

export const isOneOf = (obj, arr) =>
    arr.some((el) => el === obj);

export const last = (arr) => {
    return arr[arr.length - 1];
};

export const wrap = (str, w) =>
    w + str + w;

export const print = (obj) => inspect(obj, false, null);

export const shallowCopy = (obj) => {
    let copy = {};

    for (let prop in obj) {
        if (obj.hasOwnProperty(prop))
            copy[prop] = obj[prop];
    }
    return copy;
};
