import { describe, expect, test } from '@jest/globals';
import { validate } from '../../../src/parser/validate/validate';
import { Paramaters } from '../../../src/binder/types';

describe('Validate', () => {
    
    test('Optional (Value provided)', async () => {
        expect(await validate('Optional<string>', 'test')).toEqual({
            type: 'string',
            value: 'test',
            valid: true,
            optional: true
        });
    });



    test('Optional (No Value provided)', async () => {
        expect(await validate('Optional<string>', null)).toEqual({
            type: 'string',
            value: null,
            valid: true,
            optional: true
        });
    });



    test('Optional (Invalid)', async () => {
        expect(await validate('Optional<string>', 1)).toEqual({
            type: 'string',
            value: 1,
            valid: false,
            optional: true
        });
    });



    test('Custom (Valid)', async () => {
        const validator: Paramaters.All = (input, rejection) => {
            return input;
        };

        expect(await validate(validator, 'test')).toEqual({
            type: 'custom',
            value: 'test',
            valid: true,
            optional: false
        });
    });



    test('Custom (Invalid)', async () => {
        const validator: Paramaters.All = (input, rejection) => {
            rejection('Invalid input');
            return '';
        };

        expect(await validate(validator, 'test')).toEqual({
            type: 'custom',
            value: 'test',
            valid: false,
            optional: false
        });
    });



    test('Custom (Error)', async () => {
        const validator: Paramaters.All = (input, rejection) => {
            throw new Error('Error');
        };

        expect(await validate(validator, 'test')).toEqual({
            type: 'custom',
            value: 'test',
            valid: false,
            optional: false
        });
    });



    test('Custom (Async Valid)', async () => {
        const validator: Paramaters.All = async (input, rejection) => {
            return input;
        };

        expect(await validate(validator, 'test')).toEqual({
            type: 'custom',
            value: 'test',
            valid: true,
            optional: false
        });
    });



    test('Base (Async Valid)', async () => {
        expect(await validate('string', 'test')).toEqual({
            type: 'string',
            value: 'test',
            valid: true,
            optional: false
        });
    });
});