import { describe, expect, test } from '@jest/globals';
import { RouterTypes } from '../../src/router/types';
import ParserError from '../../src/parser/error';
import { object } from '../../src/parser/object';

describe('Object', () => {



    // -- Object_ValidInput: Test with a valid input object that satisfies all validation rules.
    test('Valid Input', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: 'boolean'
        };

        const input = {
            test: 'test',
            test2: 1,
            test3: true
        };

        expect(await object(validator, input)).toEqual({
            test: 'test',
            test2: 1,
            test3: true
        });
    });


    // -- Object_NestedObject: Test with nested objects within the input object.
    test('Nested Object', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: {
                test4: 'boolean'
            }
        };

        const input = {
            test: 'test',
            test2: 1,
            test3: {
                test4: true
            }
        };

        expect(await object(validator, input)).toEqual({
            test: 'test',
            test2: 1,
            test3: {
                test4: true
            }
        });
    });


    // -- Object_InvalidInput: Test with an invalid input object that violates one or more validation rules.
    test('Invalid Input', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: 'boolean'
        };

        const input = {
            test: 'test',
            test2: 'test',
            test3: true
        };

        expect(object(validator, input)).rejects.toBeInstanceOf(ParserError);
    }); 


    // -- Object_MissingRequiredFields: Test with an input object missing required fields.
    test('Missing Required Fields', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: 'boolean'
        };

        const input = {
            test: 'test',
            test3: true
        };

        expect(object(validator, input)).rejects.toBeInstanceOf(ParserError);
    });


    // -- Object_InvalidFieldFormat: Test with an input object containing fields with invalid formats.
    test('Invalid Field Format', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: 'boolean'
        };

        const input = {
            test: 'test',
            test2: 'test',
            test3: true
        };

        expect(object(validator, input)).rejects.toBeInstanceOf(ParserError);
    });


    // -- Object_InvalidNestedObject: Test with invalid nested objects within the input object.
    test('Invalid Nested Object', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: {
                test4: 'boolean'
            }
        };

        const input = {
            test: 'test',
            test2: 1,
            test3: {
                test4: 'test'
            }
        };

        expect(object(validator, input)).rejects.toBeInstanceOf(ParserError);
    });


    // -- Object_EmptyInput: Test with an empty input object.
    test('Empty Input', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: 'boolean'
        };

        const input = {};

        expect(object(validator, input)).rejects.toBeInstanceOf(ParserError);
    });


    // -- Object_NullInput: Test with a null input object.
    test('Null Input', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: 'boolean'
        };

        const input = null;

        

    // @ts-ignore
        expect(object(validator, input)).rejects.toBeInstanceOf(ParserError);
    });


    // -- Object_UndefinedInput: Test with an undefined input object.
    test('Undefined Input', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: 'boolean'
        };

        const input = undefined;

        

    // @ts-ignore
        expect(object(validator, input)).rejects.toBeInstanceOf(ParserError);
    });


    // -- Object_CustomValidatorFailure: Test with a custom validator function failing for some fields.
    test('Custom Validator Failure', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: (input: any, rejection: Function) => {
                rejection('Invalid input');
            },
            test2: 'number',
            test3: 'boolean'
        };

        const input = {
            test: 'test',
            test2: 1,
            test3: true
        };

        expect(object(validator, input)).rejects.toBeInstanceOf(ParserError);
    });


    // -- Object_TypeMismatch: Test with input objects where types mismatch with validation rules.
    test('Type Mismatch', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: 'boolean'
        };

        const input = {
            test: 1,
            test2: 'test',
            test3: true
        };

        expect(object(validator, input)).rejects.toBeInstanceOf(ParserError);
    });


    // -- Object_ExtraFields: Test with input objects containing extra fields not specified in the validation rules.
    test('Extra Fields', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: 'boolean'
        };

        const input = {
            test: 'test',
            test2: 1,
            test3: true,
            test4: 'test'
        };

        expect(object(validator, input)).resolves.toEqual({
            test: 'test',
            test2: 1,
            test3: true
        });
    });
    

    // -- Object_ArrayInput: Test with an input object containing arrays.
    test('Array Input', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: 'boolean'
        };

        const input = {
            test: ['test'],
            test2: 1,
            test3: true
        };

        expect(object(validator, input)).rejects.toBeInstanceOf(ParserError);
    });
    

    // -- Object_ObjectInput: Test with an input object containing nested objects
    test('Object Input', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: 'boolean'
        };

        const input = {
            test: { test: 'test' },
            test2: 1,
            test3: true
        };

        expect(object(validator, input)).rejects.toBeInstanceOf(ParserError);
    });
    

    // -- Object_ValidWithOptionalFields: Test with a valid input object containing optional fields.
    test('Valid With Optional Fields', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: 'boolean',
            test4: 'Optional<string>'
        };

        const input = {
            test: 'test',
            test2: 1,
            test3: true
        };

        expect(await object(validator, input)).toEqual({
            test: 'test',
            test2: 1,
            test3: true,
            test4: null
        });
    });
    

    // -- Object_InvalidOptionalFieldFormat: Test with an input object containing optional fields with invalid formats.
    test('Invalid Optional Field Format', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: 'boolean',
            test4: 'string'
        };

        const input = {
            test: 'test',
            test2: 1,
            test3: true,
            test4: 1
        };

        expect(object(validator, input)).rejects.toBeInstanceOf(ParserError);
    });



    // -- Object_NestedObject_ExtraFields: Test with nested objects containing extra fields not specified in the validation rules.
    test('Nested Object Extra Fields', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: {
                test4: 'boolean'
            }
        };

        const input = {
            test: 'test',
            test2: 1,
            test3: {
                test4: true,
                test5: 'test'
            }
        };

        expect(object(validator, input)).resolves.toEqual({
            test: 'test',
            test2: 1,
            test3: {
                test4: true
            }
        });
    });



    // -- Object_NestedObject_InvalidField: Test with nested objects containing fields with invalid key
    test('Nested Object Invalid Field', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: {
                test4: 'boolean'
            }
        };

        const input = {
            test: 'test',
            test2: 1,
            test3: {
                test5: 'test'
            }
        };

        expect(object(validator, input)).rejects.toBeInstanceOf(ParserError);
    });



    // -- Object_NestedObject_StringToBoolean: Test with nested objects containing fields with string values that can be converted to boolean.
    test('Nested Object String to Boolean', async () => {
        const validator: RouterTypes.Paramaters.Body = {
            test: 'string',
            test2: 'number',
            test3: {
                test4: 'boolean'
            }
        };

        const input = {
            test: 'test',
            test2: 1,
            test3: {
                test4: 'true'
            }
        };

        expect(object(validator, input)).resolves.toEqual({
            test: 'test',
            test2: 1,
            test3: {
                test4: true
            }
        });
    });
});