import {
    Boolean,
    Array,
    
    Number,
    String,
    execute,
    Optional
} from 'noise_validator';



describe('Type: Optional', () => {

    test('Valid Optional (String)', async () => {
        const optional = Optional(String, 'test');

        expect((await execute(optional, 'hello')).is_error).toBe(false);
        expect((await execute(optional, 'hello')).result).toBe('hello');
    });

    test('Valid Optional (Boolean)', async () => {
        const optional = Optional(Boolean);

        expect((await execute(optional, true)).is_error).toBe(false);
        expect((await execute(optional, true)).result).toBe(true);
    });


    test('Valid Optional (Empty)', async () => {
        const optional = Optional(String);

        expect((await execute(optional, '')).is_error).toBe(false);
        expect((await execute(optional, '')).result).toBe('');
    });

    test('Valid Optional (Null)', async () => {
        const optional = Optional(String);

        expect((await execute(optional, null)).is_error).toBe(false);
        expect((await execute(optional, null)).result).toBe(undefined);
    });

    test('Valid Optional (Undefined)', async () => {
        const optional = Optional(String);

        expect((await execute(optional, undefined)).is_error).toBe(false);
        expect((await execute(optional, undefined)).result).toBe(undefined);
    });

    test('Valid Optional (Void)', async () => {
        const optional = Optional(Boolean);

        expect((await execute(optional, void 0)).is_error).toBe(false);
        expect((await execute(optional, void 0)).result).toBe(undefined);
    });



    test('Invalid Optional (Not a Array)', async () => {
        const optional = Optional(Array(Number));

        expect((await execute(optional, 'hello')).is_error).toBe(true);
        expect((await execute(optional, 'hello')).result.message).toBe('Invalid array, must be an array');
    });

    test('Invalid Optional (Not a Boolean)', async () => {
        const optional = Optional(Boolean);

        expect((await execute(optional, 'hello')).is_error).toBe(true);
        expect((await execute(optional, 'hello')).result.message).toBe('Invalid boolean');
    });

    test('Invalid Optional (Not a Number)', async () => {
        const optional = Optional(Number);

        expect((await execute(optional, 'hello')).is_error).toBe(true);
    });


    test('Default Value', async () => {
        const optional = Optional(String, 'hello');

        expect((await execute(optional, void 0)).is_error).toBe(false);
        expect((await execute(optional, void 0)).result).toBe('hello');
    });

    test('Default Value (Null)', async () => {
        const optional = Optional(String, null);

        expect((await execute(optional, void 0)).is_error).toBe(true);
        expect((await execute(optional, void 0)).result.message).toBe('Value not provided');
    });

    test('Default Value (Boolean)', async () => {
        const optional = Optional(Boolean, true);

        expect((await execute(optional, void 0)).is_error).toBe(false);
        expect((await execute(optional, void 0)).result).toBe(true);
    });

    test('Default Value (Boolean)', async () => {
        const optional = Optional(Boolean, 1);

        expect((await execute(optional, void 0)).is_error).toBe(true);
        expect((await execute(optional, void 0)).result.message).toBe('Invalid boolean');
    });
});
