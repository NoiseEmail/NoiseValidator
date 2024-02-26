import { describe, expect, test } from '@jest/globals';
import { function_validator } from '../../../src/parser/validate/function';
import { RouterTypes } from '../../../src/router/types';


describe('Function', () => {
    
    test('Function valid', () => {
        const validator: RouterTypes.Binder.Parameter = (input, rejection) => {
            return input;
        };


        expect(validator).toBeInstanceOf(Function);
        expect(function_validator(validator, 'test')).resolves.toEqual({
            type: 'custom',
            value: 'test',
            valid: true,
            optional: false
        });
    });



    test('Function invalid', () => {
        const validator: RouterTypes.Binder.Parameter = (input, rejection) => {
            rejection('Invalid input');
            return input;
        };


        expect(validator).toBeInstanceOf(Function);
        expect(function_validator(validator, 'test')).resolves.toEqual({
            type: 'custom',
            value: 'test',
            valid: false,
            optional: false
        });
    });




    test('Function error', () => {
        const validator: RouterTypes.Binder.Parameter = (input, rejection) => {
            throw new Error('Error');
        };


        expect(validator).toBeInstanceOf(Function);
        expect(function_validator(validator, 'test')).resolves.toEqual({
            type: 'custom',
            value: 'test',
            valid: false,
            optional: false
        });
    });



    test('Async function valid', () => {
        const validator: RouterTypes.Binder.Parameter = async (input, rejection) => {
            return input;
        };


        expect(validator).toBeInstanceOf(Function);
        expect(function_validator(validator, 'test')).resolves.toEqual({
            type: 'custom',
            value: 'test',
            valid: true,
            optional: false
        });
    });



    test('Async function invalid', () => {
        const validator: RouterTypes.Binder.Parameter = async (input, rejection) => {
            rejection('Invalid input');
            return input;
        };


        expect(validator).toBeInstanceOf(Function);
        expect(function_validator(validator, 'test')).resolves.toEqual({
            type: 'custom',
            value: 'test',
            valid: false,
            optional: false
        });
    });



    test('Async function error', () => {
        const validator: RouterTypes.Binder.Parameter = async (input, rejection) => {
            throw new Error('Error');
        };


        expect(validator).toBeInstanceOf(Function);
        expect(function_validator(validator, 'test')).resolves.toEqual({
            type: 'custom',
            value: 'test',
            valid: false,
            optional: false
        });
    });



    test('Promise valid', () => {
        const validator: RouterTypes.Binder.Parameter = (input, rejection) => {
            return new Promise((resolve, reject) => {
                resolve(input);
            });
        };


        expect(validator).toBeInstanceOf(Function);
        expect(function_validator(validator, 'test')).resolves.toEqual({
            type: 'custom',
            value: 'test',
            valid: true,
            optional: false
        });
    });



    test('Promise invalid', () => {
        const validator: RouterTypes.Binder.Parameter = (input, rejection) => {
            return new Promise((resolve, reject) => {
                reject('Invalid input');
            });
        };


        expect(validator).toBeInstanceOf(Function);
        expect(function_validator(validator, 'test')).resolves.toEqual({
            type: 'custom',
            value: 'test',
            valid: false,
            optional: false
        });
    });



    test('Promise error', () => {
        const validator: RouterTypes.Binder.Parameter = (input, rejection) => {
            return new Promise((resolve, reject) => {
                reject(new Error('Error'));
            });
        };


        expect(validator).toBeInstanceOf(Function);
        expect(function_validator(validator, 'test')).resolves.toEqual({
            type: 'custom',
            value: 'test',
            valid: false,
            optional: false
        });
    });



    test('Non-function', () => {
        expect(function_validator('test', 'test')).resolves.toEqual({
            type: 'custom',
            value: 'test',
            valid: false,
            optional: false
        });
    });
});