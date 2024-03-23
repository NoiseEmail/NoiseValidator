import {
    Boolean,
    execute
} from 'noise_validator';



describe('Type: Boolean', () => {

    test('Valid boolean', async () => {
        const schema = Boolean;
        const result = await execute(schema, true);

        expect(result.is_error).toBe(false);
        expect(result.result).toBe(true);
    });

    test('Valid boolean (string)', async () => {
        const schema = Boolean;
        const result = await execute(schema, 'true');

        expect(result.is_error).toBe(false);
        expect(result.result).toBe(true);
    });

    test('Invalid boolean (string case)', async () => {
        const schema = Boolean;
        const result = await execute(schema, 'True');

        expect(result.is_error).toBe(false);
        expect(result.result).toBe(true);
    });

    test('Invalid boolean (string)', async () => {
        const schema = Boolean;
        const result = await execute(schema, 'hello');

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Invalid boolean');
    });

    test('Invalid boolean', async () => {
        const schema = Boolean;
        const result = await execute(schema, 'hello');

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Invalid boolean');
    });

    test('No value passed', async () => {
        const schema = Boolean;
        const result = await execute(schema, undefined);

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Value not provided');
    });

});