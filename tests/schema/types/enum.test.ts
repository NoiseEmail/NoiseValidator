import {
    Enum,
    execute
} from 'noise_validator';



describe('Type: Enum', () => {


    test('Valid Enum (String)', async () => {
        const schema = Enum('hello', 'world');
        const result = await execute(schema, 'hello');

        expect(result.is_error).toBe(false);
        expect(result.result).toBe('hello');
    });

    test('Invalid Enum (String)', async () => {
        const schema = Enum('hello', 'world');
        const result = await execute(schema, 'test');

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Value not in enum');
    });

    test('Valid Enum (Number)', async () => {
        const schema = Enum(1, 2, 3);
        const result = await execute(schema, 1);

        expect(result.is_error).toBe(false);
        expect(result.result).toBe(1);
    });

    test('Invalid Enum (Number)', async () => {
        const schema = Enum(1, 2, 3);
        const result = await execute(schema, 4);

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Value not in enum');
    });

    test('Valid Enum (boolean)', async () => {
        const schema = Enum(true, false);
        const result = await execute(schema, true);

        expect(result.is_error).toBe(false);
        expect(result.result).toBe(true);
    });

    test('Invalid Enum (boolean)', async () => {
        const schema = Enum(true, false);
        const result = await execute(schema, 'test');

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Value not in enum');
    });

    test('Valid Enum (mixed)', async () => {
        const schema = Enum('hello', 1, true);
        const result = await execute(schema, 1);

        expect(result.is_error).toBe(false);
        expect(result.result).toBe(1);
    });

    test('Invalid Enum (mixed)', async () => {
        const schema = Enum('hello', 1, true);
        const result = await execute(schema, 'test');

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Value not in enum');
    });


    test('No value passed', async () => {
        const schema = Enum('hello', 'world');
        const result = await execute(schema, undefined);

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Value not provided');
    });

    test('Not an Enum supported type', async () => {
        const schema = Enum('hello', 'world');
        const result = await execute(schema, { test: 'hello' });

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Invalid enum value type');
    });
});
