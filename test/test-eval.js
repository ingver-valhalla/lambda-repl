import { describe, it } from 'mocha';
import { assert } from 'chai';
import { parse, tokenize } from '../lib/parser';
import { substitute, evalAst } from '../lib/eval';

describe('Tesing eval', () => {
    const read = (str) => {
        return parse(tokenize(str));
    };

    describe('#substitute', () => {
        let globalEnv = {};
        it('should return lambda unchanged', () => {
            const expr = '\\x.x';
            const ast = read(expr);
            const result = substitute(ast, globalEnv);

            assert.deepEqual(ast, result);
        });

        it('should substitute free variables', () => {
            const x = '\\x.\\y.x';
            const y = '\\x.\\y.y';
            globalEnv.x = read(x);
            globalEnv.y = read(y);
            const expr = 'y (\\z.x (\\x.x y) z) y';
            const result = substitute(read(expr), globalEnv);
            const expected =
                read('(' + y + ')(\\z.(' + x + ')(\\x.x(' + y + ')) z)(' + y + ')');

            assert.deepEqual(result, expected);
        });
    });
});
