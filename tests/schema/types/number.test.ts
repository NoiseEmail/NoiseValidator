import {
    Number,
    execute
} from 'noise_validator';



describe('Type: Number', () => {

    test('Valid number', async () => {
        const schema = Number.config({ mode: 'integer' });
        const result = await execute(schema, 1);

        expect(result.is_error).toBe(false);
        expect(result.result).toBe(1);
    });

    test('Valid number (string)', async () => {
        const schema = Number.config({ mode: 'integer' });
        const result = await execute(schema, '1');

        expect(result.is_error).toBe(false);
        expect(result.result).toBe(1);
    });

    test('Invalid number (string)', async () => {
        const schema = Number.config({ mode: 'integer' });
        const result = await execute(schema, 'hello');

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Invalid number');
    });

    test('Invalid number', async () => {
        const schema = Number.config({ mode: 'integer' });
        const result = await execute(schema, 'hello');

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Invalid number');
    });

    test('No value passed', async () => {
        const schema = Number;
        const result = await execute(schema, undefined);

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Value not provided');
    });

    test("Max number not killing the schema", async () => {
        const schema = Number
        const result = await execute(schema, 9007199254740991 + 10);

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Number exceeds maximum value');
    });

    test("Float number", async () => {
        const schema = Number.config({ mode: 'float' });
        const result = await execute(schema, 1.5);

        expect(result.is_error).toBe(false);
        expect(result.result).toBe(1.5);
    });

    test("Float number (string)", async () => {
        const schema = Number.config({ mode: 'float' });
        const result = await execute(schema, '1.5');

        expect(result.is_error).toBe(false);
        expect(result.result).toBe(1.5);
    });

    test("Float number (invalid)", async () => {
        const schema = Number.config({ mode: 'float' });
        const result = await execute(schema, 'hello');

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Invalid number');
    });


    // -- Test both
    test("Both number Float", async () => {
        const schema = Number.config({ mode: 'both' });
        const result = await execute(schema, 1.5);

        expect(result.is_error).toBe(false);
        expect(result.result).toBe(1.5);
    });

    test("Both number Float (string)", async () => {
        const schema = Number.config({ mode: 'both' });
        const result = await execute(schema, '1.5');

        expect(result.is_error).toBe(false);
        expect(result.result).toBe(1.5);
    });

    test("Both number Integer", async () => {
        const schema = Number.config({ mode: 'both' });
        const result = await execute(schema, 1);

        expect(result.is_error).toBe(false);
        expect(result.result).toBe(1);
    });

    test("Both number Integer (string)", async () => {
        const schema = Number.config({ mode: 'both' });
        const result = await execute(schema, '1');

        expect(result.is_error).toBe(false);
        expect(result.result).toBe(1);
    });

    test("Both number invalid", async () => {
        const schema = Number.config({ mode: 'both' });
        const result = await execute(schema, 'hello');

        expect(result.is_error).toBe(true);
        expect(result.result.message).toBe('Invalid number');
    });
});