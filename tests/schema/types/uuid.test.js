import {
    Uuid,
    execute
} from 'noise_validator';

import { 
    v1 as uuidv1,
    v3 as uuidv3,
    v4 as uuidv4, 
    validate, version 
} from 'uuid';



describe('Type: UUID', () => {

    test('Valid V4 UUID', async () => {
        const uuid = uuidv4();

        expect((await execute(Uuid, uuid)).is_error).toBe(false);
        expect((await execute(Uuid, uuid)).result).toBe(uuid);
    });

    test('Invalid UUID (Not a UUID)', async () => {
        const uuid = '1234';

        expect((await execute(Uuid, uuid)).is_error).toBe(true);
        expect((await execute(Uuid, uuid)).result.message).toBe('Invalid UUID, not a valid UUID');
    });

    test('Invalid UUID (Not a string)', async () => {
        const uuid = 1234;

        expect((await execute(Uuid, uuid)).is_error).toBe(true);
        expect((await execute(Uuid, uuid)).result.message).toBe('Invalid UUID, not a string');
    })

    test('Invalid V1 UUID', async () => {
        const uuid = uuidv1();

        expect((await execute(Uuid, uuid)).is_error).toBe(true);
        expect((await execute(Uuid, uuid)).result).toBeInstanceOf(Error);
    });

    test('Invalid V3 UUID', async () => {
        const uuid = uuidv3('hello', uuidv3.DNS);

        expect((await execute(Uuid, uuid)).is_error).toBe(true);
        expect((await execute(Uuid, uuid)).result).toBeInstanceOf(Error);
    });


    test('Valid UUID V1 Config' , async () => {
        const uuid = uuidv1();

        expect((await execute(Uuid.config({ version: 1 }), uuid)).is_error).toBe(false);
        expect((await execute(Uuid.config({ version: 1 }), uuid)).result).toBe(uuid);
    });

    test('Invalid UUID V1 Config', async () => {
        const uuid = uuidv4();

        expect((await execute(Uuid.config({ version: 1 }), uuid)).is_error).toBe(true);
        expect((await execute(Uuid.config({ version: 1 }), uuid)).result).toBeInstanceOf(Error);
    });




    test('Valid UUID, auto generate (Not a UUID)', async () => {
        expect((await execute(Uuid.config({create_new_if_invalid: true}))).is_error).toBe(false);
        expect(validate((await execute(Uuid.config({create_new_if_invalid: true}))).result)).toBe(true);
    });

    test('Valid UUID, auto generate (V1)', async () => {
        expect((await execute(Uuid.config({create_new_if_invalid: true, version: 1}))).is_error).toBe(false);
        expect(version((await execute(Uuid.config({create_new_if_invalid: true, version: 1}))).result)).toBe(1);
    });



    test('UUID No dashes', async () => {
        const uuid = uuidv4().replace(/-/g, '');

        expect((await execute(Uuid, uuid)).is_error).toBe(true);
        expect((await execute(Uuid, uuid)).result.message).toBe('Invalid UUID, not a valid UUID');
    });
});