// constructs syntax error object
export const syntaxError = (msg) => {
    return {
        err: "SyntaxError",
        msg: msg
    };
};

// checks for syntax error object
export const isSyntaxError = (obj) => {
    return obj && obj.hasOwnProperty('err')
        && obj.err === "SyntaxError"
        && obj.hasOwnProperty('msg');
};
