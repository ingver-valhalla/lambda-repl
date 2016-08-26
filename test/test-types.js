import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as t from '../lib/types';

describe('Testing types', () => {
    describe('#isSpecial', () => {
        it('should recognize special chars', () => {
            assert.ok(t.specChars.every((ch) => t.isSpecial(ch)));
        });
    });

    describe('#isName', () => {
        it('should recognize names', () => {
            const names = ['asdf', 'bAr', 'TEST'];
            assert.ok(names.every((str) => t.isName(str)));
        });
        it('should deny others', () => {
            const nonNames = ['123', '1abcd', 'foo.bar'];
            assert.ok(nonNames.every((str) => !t.isName(str)));
        });
    });

    describe('#isNum', () => {
        it('should recognize numbers', () => {
            const nums = ['123', '456', '678', '90'];
            assert.ok(nums.every((str) => t.isNum(str)));
        });
        it('should deny non-numbers', () => {
            const nonNums = ['a123', 'AASD'];
            assert.ok(nonNums.every((str) => !t.isNum(str)));
        });
    });

    describe('#isAtom', () => {
        it('should recognize atoms', () => {
            const atoms = ['123', 'abcd', 'foo42'];
            assert.ok(atoms.every((str) => t.isAtom(str)));
        });

        it('should deny non-atoms', () => {
            assert.ok(!t.isAtom(['f', 'x', 'y']));
        });
    });

});
