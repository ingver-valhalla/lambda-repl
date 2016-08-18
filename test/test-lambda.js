import { define, it } from 'mocha';
import { assert } from 'chai';
import { tokenize, group, parse } from '../lib/lambda';

describe('Testing parser', () => {
    const isError = (err) => {
        return err !== undefined
            && err.hasOwnProperty('err')
            && err.hasOwnProperty('msg');
    }

    describe('#tokenize', () => {
        const tokTest = (expr, expected) => {
            const ret = tokenize(expr);
            assert.deepEqual(ret, expected);
        };

        it('should return array of tokens', () => {
            tokTest('\\x.x', ['\\', 'x', '.', 'x']);
            tokTest('(\\x.t.t x)',
                    ['(', '\\', 'x', '.', 't', '.', 't', 'x', ')']);
            tokTest('λ', ['\\']);
            tokTest('let x = t', ['let', 'x', '=', 't']);
        });
    });

    describe('#group', () => {
        const groupTest = (expr, expected) => {
            const ret = group(tokenize(expr));
            assert.deepEqual(ret, expected);
        };

        it('should group tokens', () => {
            const expr = '(\\x.x x)(\\x. x x )',
                expect = [['\\', 'x', '.', 'x', 'x'],
                          ['\\', 'x', '.', 'x', 'x']];
            groupTest(expr, expect);
        });

        it('should deeply group', () => {
            const expr = '(\\f.\\g.\\x.f (g x)) a b';
            const expect = [['\\', 'f', '.', '\\', 'g', '.', '\\', 'x', '.',
                               'f', ['g', 'x']], 'a', 'b'];
            groupTest(expr, expect);
        });

        it('shouldn\'t group if no parens', () => {
            groupTest('\\x.x', ['\\', 'x', '.', 'x']);
        });

        it('should return error if parenthesis group nothing', () => {
            const expr = '(())';
            const ret = group(tokenize(expr));
            assert.ok(isError(ret));
        });

        it('should signal about missing parens', () => {
            const err1 = '(\\x.x', ret1 = group(tokenize(err1)),
                  err2 = '\\x.x)', ret2 = group(tokenize(err2));
            assert.ok(isError(ret1));
            assert.ok(isError(ret2));
        });
    });

    describe('#parse', () => {
        const parseTest = (expr, expected) => {
            const ret = parse(tokenize(expr));
            assert.deepEqual(ret, expected);
        };
        const errorTest = (expr) => {
            const tokens = tokenize(expr);
            const ret = parse(tokens);
            assert.ok(isError(ret));
        };

        it('should return atom unchanged', () => {
            parseTest('x', ['x']);
        });

        it('should return lambda-object for lambda-abstraction', () => {
            const exp = ['\\', 'x', ['x']];
            parseTest('\\x.x', exp);
            parseTest('λx.x', exp);
        });

        it('should nest lambda-abstractions', () => {
            const exp = ['\\', 'x', ['\\', 'z', ['y']]];
            parseTest('\\x.\\z.y', exp);
        });

        it('should return array for application', () => {
            const exp = ['\\', 'x', ['f', 'x', 'x']];
            parseTest('\\x.f x x', exp);
        });

        it('should handle parenthesized expression', () => {
            const exp = [['\\', 'x', ['x', 'x']], ['\\', 'x', ['x', 'x']]];
            parseTest('(\\x.x x)(\\x. x x )', exp);
        });

        it('should handle nested expr', () => {
            const exp = [['\\', 'f',
                            ['f', ['\\', 'x', ['x', 'x']],
                                  ['\\', 'x', ['x', 'x']]]], 'g'];
            parseTest('(\\f. f (\\x.x x) (\\x.x x)) g', exp);
        });

        it('should handle `let\' forms', () => {
            const exp1 = ['let', 'id', ['\\', 'x', ['x']]],
                  exp2 = ['let', 'f', [['\\', 'x', ['\\', 'y', ['y', 'x']]], 'z']];
            parseTest('let id = \\x.x', exp1);
            parseTest('let f = (\\x.\\y. y x) z', exp2);
        });

        it('should handle errors', () => {
            errorTest('\\');
            errorTest('x \\');
            errorTest('\\\\');
            errorTest('let x');
            errorTest('let x =');
            errorTest('let x = \\');
            errorTest('\\ x. let x = e');
            errorTest('(let x = asd)');
        });
    });
});
