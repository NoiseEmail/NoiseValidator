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

});