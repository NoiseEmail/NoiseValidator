import { describe, expect, test } from '@jest/globals';
import { base_validator } from '../../../src/parser/validate/base';
import { RouterTypes } from '../../../src/router/types';


describe('Base', () => {
    
    
    test('String valid', () => {
        expect(base_validator('string', false, 'test')).toEqual({
            type: 'string',
            value: 'test',
            valid: true,
            optional: false
        });
    });



    test('String invalid', () => {
        expect(base_validator('string', false, 1)).toEqual({
            type: 'string',
            value: 1,
            valid: false,
            optional: false
        });
    });



    test('String optional', () => {
        expect(base_validator('string', true, null)).toEqual({
            type: 'string',
            value: null,
            valid: true,
            optional: true
        });
    });



    test('String optional (Value provided)', () => {
        expect(base_validator('string', true, 'test')).toEqual({
            type: 'string',
            value: 'test',
            valid: true,
            optional: true
        });
    });



    test('Number valid', () => {
        expect(base_validator('number', false, '1')).toEqual({
            type: 'number',
            value: 1,
            valid: true,
            optional: false
        });
    });



    test('Number invalid', () => {
        expect(base_validator('number', false, 'test')).toEqual({
            type: 'number',
            value: null,
            valid: false,
            optional: false
        });
    });



    test('Number optional', () => {
        expect(base_validator('number', true, null)).toEqual({
            type: 'number',
            value: null,
            valid: true,
            optional: true
        });
    });



    test('Number optional (Value provided)', () => {
        expect(base_validator('number', true, '1')).toEqual({
            type: 'number',
            value: 1,
            valid: true,
            optional: true
        });
    });



    test('Boolean valid', () => {
        expect(base_validator('boolean', false, true)).toEqual({
            type: 'boolean',
            value: true,
            valid: true,
            optional: false
        });
    });



    test('Boolean invalid', () => {
        expect(base_validator('boolean', false, 'test')).toEqual({
            type: 'boolean',
            value: null,
            valid: false,
            optional: false
        });
    });



    test('Boolean optional', () => {
        expect(base_validator('boolean', true, null)).toEqual({
            type: 'boolean',
            value: null,
            valid: true,
            optional: true
        });
    });



    test('Boolean optional (Value provided)', () => {
        expect(base_validator('boolean', true, false)).toEqual({
            type: 'boolean',
            value: false,
            valid: true,
            optional: true
        });
    });
});