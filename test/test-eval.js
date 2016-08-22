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

        it('test 3', () => {
            globalEnv.set('0', read('\\s.\\z.z'));
            globalEnv.set('succ', read('\\n.\\s.\\z.s(n s z)'));

            const one = 'succ 0',
                  one_res = substitute(read(one), globalEnv),
                  one_exp = read('\\s.\\z.s z');
            const two = 'succ (succ 0)',
                  two_res = substitute(read(two), globalEnv),
                  two_exp = read('\\s.\\z.s (s z)');

            assert.deepEqual(one_res, one_exp);
            assert.deepEqual(two_res, two_exp);
        });

        it('test 4', () => {
            globalEnv.set('1', read('\\s.\\z.s z'));
            globalEnv.set('2', read('\\s.\\z.s (s z)'));

            const one = '1 succ';
            const one_result = substitute(read(one), globalEnv);
            const one_expected = read("\\z.\\s.\\z'.s(z s z')");
            assert.deepEqual(one_result, one_expected);
        });
    });
});
