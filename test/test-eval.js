import { describe, it } from 'mocha';
import { assert } from 'chai';
import { tokenize, parse } from '../lib/parser';
import Env from '../lib/env';
import { substitute, evalAst } from '../lib/eval';

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
            const expected = read("\\y.\\x'.x'");

            assert.deepEqual(result, expected);
        });

        it('test 2', () => {
            globalEnv.set('doubley', read('\\x.\\y.y y x'));

            const expr = 'doubley id';
            const result = substitute(read(expr), globalEnv);
            const expected = read("\\y. y y (\\x'.x')");

            assert.deepEqual(result, expected);
        });

        it('test 3', () => {
            globalEnv.set('zero', read('\\s.\\z.z'));
            globalEnv.set('succ', read('\\n.\\s.\\z.s(n s z)'));

            const one = 'succ zero',
                  one_res = substitute(read(one), globalEnv),
                  one_exp = read('\\s.\\z.s z');
            const two = 'succ (succ zero)',
                  two_res = substitute(read(two), globalEnv),
                  two_exp = read("\\s.\\z.s (s z)");

            assert.deepEqual(one_res, one_exp);
            assert.deepEqual(two_res, two_exp);
        });

        it('test 4', () => {
            globalEnv.set('one', read('\\s.\\z.s z'));
            globalEnv.set('two', read('\\s.\\z.s (s z)'));

            const one = 'one succ';
            const one_result = substitute(read(one), globalEnv);
            const one_expected = read("\\z.\\s'.\\z'.s'(z s' z')");
            assert.deepEqual(one_result, one_expected);

            const two = 'two succ';
            const two_result = substitute(read(two), globalEnv);
            const two_expected = read("\\z.\\s'.\\z'.s' (s' (z s' z'))");
            assert.deepEqual(two_result, two_expected);
        });
    });
    describe('#evalAst', () => {
        let globalEnv = new Env();
        it('test 0', () => {
            evalAst(read('let applyToTwo = \\f.\\x.\\y.f x y'), globalEnv);
            evalAst(read('let sumOfTwo = applyToTwo +'), globalEnv);
            const five = evalAst(read('sumOfTwo 2 3'), globalEnv);

            assert.equal(five, 5);
        });
        it('test 1', () => {
            let env = new Env();
            const one = evalAst(read('(\\s.\\z.s z) 1+ 0'), env);
            assert.equal(one, 1);
        });
    });
});
