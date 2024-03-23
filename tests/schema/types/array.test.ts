import {
    Array,
    Uuid,
    String,
    Boolean,
    execute
} from 'noise_validator';



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
