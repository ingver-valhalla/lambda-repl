import { describe, it } from 'mocha';
import { assert } from 'chai';
import { tokenize, parse } from '../lib/parser';
import Env from '../lib/env';
import { substitute } from '../lib/eval';
import { print } from '../lib/utils';

describe('Testing eval', () => {
    const read = (str) => parse(tokenize(str));

    describe('#substitute', () => {
        let globalEnv = new Env();
        it('test 0', () => {
            const expr = '\\y.y y y';
            const result = substitute(read(expr), globalEnv);
            const expected = read(expr);

            assert.deepEqual(result, expected);
        });
        it('test 1', () => {
            globalEnv.set('id', read('\\x.x'));
            globalEnv.set('left', read('\\x.\\y.x'));

            const expr = 'left id';
            const result = substitute(read(expr), globalEnv);
            const expected = read('\\y.\\x.x');

            assert.deepEqual(result, expected);
        });

        it('test 2', () => {
            globalEnv.set('doubley', read('\\x.\\y.y y x'));

            const expr = 'doubley id';
            const result = substitute(read(expr), globalEnv);
            const expected = read('\\y. y y (\\x.x)');

            assert.deepEqual(result, expected);
        });

    });
});
