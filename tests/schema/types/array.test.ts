import {
    Array,
    Uuid,
    String,
    Boolean,
    execute
} from 'noise_validator';


// const ArrayType = <
//     Constructor extends Schema.GenericTypeConstructor<any>,
//     ReturnType = Schema.ExtractParamaterReturnType<Constructor>,
//     InputShape = Schema.ExtractParamaterInputShape<Constructor>
// >(
//     constructor: Constructor
// ) => class ArrayClass extends GenericType<
//     Array<ReturnType>, InputShape | undefined
// > {
//     constructor(
//         input_value: unknown,
//         on_invalid: (error: GenericError) => void,
//         on_valid: (result: Array<ReturnType>) => void,
//     ) {
//         super(input_value, on_invalid, on_valid);
//     }

//     protected handler = async (): Promise<Array<ReturnType>> => {

//         // -- Make sure the value is an array to begin with
//         if (!Array.isArray(this.value)) 
//             throw this.invalid('Invalid array');


//         // -- Else, loop through the array and execute the constructor
//         //    for each value in the array
//         const results: Array<ReturnType> = [];
//         for (const value of this.value) {
//             const instance = new constructor(value,
//                 (error) => {
//                     this.invalid(error);
//                     throw error; // -- This will break the loop
//                 },
//                 (value) => results.push(value)
//             );

//             await instance.execute();
//         }


//         // -- Return the results
//         return results;
//     }

//     public static get name() {
//         return `Array<${constructor.name}>`;
//     }
// }



// const create_array: <T>(
//     constructor: Schema.GenericTypeConstructor<T>
// ) => new (
//     input_value: unknown,
//     on_invalid: (error: GenericError) => void,
//     on_valid: (result: Array<T> | undefined) => void,
// ) => GenericType<Array<T>> = ArrayType;



// export default create_array;
describe('Type: Array', () => {

    test('Array of strings', async () => {
        const schema = Array(String);
        const result = await execute(schema, ['hello', 'world']);

        expect(result.is_error).toBe(false);
        expect(result.result).toEqual(['hello', 'world']);
    });

    test('Array of booleans', async () => {
        const schema = Array(Boolean);
        const result = await execute(schema, [true, false]);

        expect(result.is_error).toBe(false);
        expect(result.result).toEqual([true, false]);
    });

    test('Array of UUIDs', async () => {
        const schema = Array(Uuid);
        const result = await execute(schema, ['f47ac10b-58cc-4372-a567-0e02b2c3d479', 'f47ac10b-58cc-4372-a567-0e02b2c3d479']);

        expect(result.is_error).toBe(false);
        expect(result.result).toEqual(['f47ac10b-58cc-4372-a567-0e02b2c3d479', 'f47ac10b-58cc-4372-a567-0e02b2c3d479']);
    });



    test('Array of fully invalid values', async () => {
        const schema = Array(Boolean);
        const result = await execute(schema, ['hello', 'world']);

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Invalid boolean');
    });

    test('Array of partially invalid values', async () => {
        const schema = Array(Boolean);
        const result = await execute(schema, [true, 'world']);

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Invalid boolean');
    });



    test('No value passed', async () => {
        const schema = Array(Boolean);
        const result = await execute(schema, undefined);

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Invalid array, must be an array');
    });

    test('Not an array', async () => {
        const schema = Array(Boolean);
        const result = await execute(schema, 'hello');

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Invalid array, must be an array');
    });
});
