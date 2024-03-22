import { describe, expect, test } from '@jest/globals';
import { 
    GenericError
} from 'gs';


describe('GenericError', () => {

    test('GenericError is an instance of Error', () => {
        const error = new GenericError('Test', 500);
        expect(error).toBeInstanceOf(Error);
    });

    test('GenericError is an instance of GenericError', () => {
        const error = new GenericError('Test', 500);
        expect(error).toBeInstanceOf(GenericError);
    });

    test('GenericError extended is an instance of Error', () => {
        class TestError extends GenericError {
            public constructor() {
                super('Test', 500);
            }
        }
        const error = new TestError();
        expect(error).toBeInstanceOf(Error);
    });

    test('GenericError extended is an instance of GenericError', () => {
        class TestError extends GenericError {
            public constructor() {
                super('Test', 500);
            }
        }
        const error = new TestError();
        expect(error).toBeInstanceOf(GenericError);
    });

    test('is_error returns true for GenericError', () => {
        const error = new GenericError('Test', 500);
        expect(GenericError.is_error(error)).toBe(true);
    });

    test('is_error returns true for GenericError extended', () => {
        class TestError extends GenericError {
            public constructor() {
                super('Test', 500);
            }
        }
        const error = new TestError();
        expect(GenericError.is_error(error)).toBe(true);
    });

    test('is_error returns true for Error', () => {
        const error = new Error('Test');
        expect(GenericError.is_error(error)).toBe(true);
    });

    test('is_error returns false for non errors', () => {
        expect(GenericError.is_error('Test')).toBe(false);
        expect(GenericError.is_error(500)).toBe(false);
        expect(GenericError.is_error({})).toBe(false);
        expect(GenericError.is_error([])).toBe(false);
    }); 



    test('GenericError has a message', () => {
        const error = new GenericError('Test', 500);
        expect(error.message).toBe('Test');
    });

    test('GenericError has a code', () => {
        const error = new GenericError('Test', 500);
        expect(error.code).toBe(500);
    });

    test('GenericError has a type', () => {
        const error = new GenericError('Test', 500);
        expect(error.type).toBe('GenericError');
    });

    test('GenericError has a type (extended)', () => {
        class TestError extends GenericError {
            public constructor() {
                super('Test', 500);
            }
        }
        const error = new TestError();
        expect(error.type).toBe('TestError');
    });

    test('GenericError has an id', () => {
        const error = new GenericError('Test', 500);
        expect(error.id).toBeDefined();
    });

    test('GenericError has data', () => {
        const error = new GenericError('Test', 500);
        expect(error.data).toEqual({});
    });

    test('GenericError has data set', () => {
        const error = new GenericError('Test', 500);
        error.data = { test: 'test' };
        expect(error.data).toEqual({ test: 'test' });
    });




    // -- Adding multiple errors
    test('GenericError can add an error', () => {
        const error = new GenericError('Test', 500);
        const error2 = new GenericError('Test2', 500);
        error.add_error(error2);

        console.log(error.serialize());
        expect(error.serialize().errors).toEqual([ error2.serialize() ]);
    });

    test('GenericError can add multiple errors', () => {
        const error = new GenericError('Test', 500);
        const error2 = new GenericError('Test2', 500);
        const error3 = new GenericError('Test3', 500);
        error.add_error(error2);
        error.add_error(error3);

        expect(error.serialize().errors).toEqual([ error2.serialize(), error3.serialize() ]);
    });



    // -- Serializing
    test('GenericError can serialize', () => {
        const error = new GenericError('Test', 500);
        expect(error.serialize()).toEqual({
            id: error.id,
            message: 'Test',
            code: 500,
            data: {},
            type: 'GenericError',
            errors: []
        });
    });



    // -- from_error
    test('GenericError can be created from an error', () => {
        const error = new Error('Test');
        const generic_error = GenericError.from_error(error);
        expect(generic_error).toBeInstanceOf(GenericError);
    });


    // -- From unknown
    test('GenericError can be created from an unknown', () => {
        const error = new Error('Test');
        const generic_error = GenericError.from_error(error);
        const string = 'Other';
        const invalid = {};

        expect(GenericError.from_unknown(error).message).toBe('Test');
        expect(GenericError.from_unknown(generic_error).message).toBe('Test');
        expect(GenericError.from_unknown(string).message).toBe('Other');
        expect(GenericError.from_unknown(invalid).message).toBe('An unknown error occurred');
    });
});