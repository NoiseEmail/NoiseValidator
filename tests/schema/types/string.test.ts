import {
    String,
    execute
} from 'noise_validator';



describe('Type: String', () => {

    test('Valid string', async () => {
        const schema = String;
        const result = await execute(schema, 'hello');

        expect(result.is_error).toBe(false);
        expect(result.result).toBe('hello');
    });

    test('No value passed', async () => {
        const schema = String;
        const result = await execute(schema, undefined);

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Value not provided');
    });

    test('String too long', async () => {
        const schema = String.config({ max_length: 5 });

        const result = await execute(schema, 'hello world');

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Invalid string, too long');
    });

    test('String too short', async () => {
        const schema = String.config({ min_length: 5 });

        const result = await execute(schema, 'hi');

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Invalid string, too short');
    });

    test('String does not match regex', async () => {
        const schema = String.config({ regex: /^[a-z]+$/ });

        const result = await execute(schema, 'hello world');

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Invalid string, does not match regex');
    });

    test('String is valid lenght', async () => {
        const schema = String.config({ min_length: 5, max_length: 10 });

        const result = await execute(schema, 'hello');

        expect(result.is_error).toBe(false);
        expect(result.result).toBe('hello');
    });

    test('String is exactly 5 characters', async () => {
        const schema = String.config({ min_length: 5, max_length: 5 });

        const result = await execute(schema, 'hello');

        expect(result.is_error).toBe(false);
        expect(result.result).toBe('hello');
    });
});