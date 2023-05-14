'use strict';
const kCode = Symbol('code');
const messages = new Map();

function makeLibError(Base) {
    return class BotError extends Base {
        constructor(key, ...args) {
            super(message(key, args));
            this[kCode] = key;
            if (Error.captureStackTrace) Error.captureStackTrace(this, BotError);
        }
        get name() {
            return `${super.name} [${this[kCode]}]`;
        }
        get code() {
            return this[kCode];
        }
    };
}
function message(key, args) {
    if (typeof key !== 'string') throw new Error('Error message key must be a string');
    const msg = messages.get(key);
    if (!msg) throw new Error(`an invalid message key was used: ${key}`);
    if (typeof msg === 'function') return msg(...args);
    if (!args?.length) return msg;
    args.unshift(msg);
    return String(...args);
}
function register(name, value) {
    messages.set(name, typeof value === 'function' ? value : String(value));
}

module.exports = {
    register,
    Error: makeLibError(Error),
    TypeError: makeLibError(TypeError),
    RangeError: makeLibError(RangeError)
};