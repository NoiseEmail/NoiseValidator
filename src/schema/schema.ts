import { randomUUID } from 'crypto';
import { Schema as SchemaTypes } from './types.d';
import { GenericError as GenericErrorTypes } from '../error/types.d';
import { SchemaExecutionError, SchemaMissingFieldError } from './errors';
import { execute } from './generic_type';



export default class Schema<
    InputSchema extends SchemaTypes.InputSchema | SchemaTypes.FlatSchema,
    ReturnableData = SchemaTypes.ParsedSchema<InputSchema>
> { 
    private readonly _id: string = randomUUID();
    private readonly _schema: InputSchema;

    get data(): ReturnableData {
        throw new Error('Method not implemented.');
    }

    private constructor(
        schema: InputSchema
    ) {
        this._schema = schema;
    };



    public static Body = class <
        InputSchema extends SchemaTypes.InputSchema,
        ReturnableData = SchemaTypes.ParsedSchema<InputSchema>
    > extends Schema<InputSchema, ReturnableData> {
        public readonly _type: 'body' = 'body';
        public constructor(schema: InputSchema) { super(schema); };
    };

    public static Query = class <
        InputSchema extends SchemaTypes.FlatSchema,
        ReturnableData = SchemaTypes.ParsedSchema<InputSchema>
    > extends Schema<InputSchema, ReturnableData> {
        public readonly _type: 'query' = 'query';
        public constructor(schema: InputSchema) { super(schema); };
    };

    public static Headers = class <
        InputSchema extends SchemaTypes.FlatSchema,
        ReturnableData = SchemaTypes.ParsedSchema<InputSchema>
    > extends Schema<InputSchema, ReturnableData> {
        public readonly _type: 'headers' = 'headers';
        public constructor(schema: InputSchema) { super(schema); };
    };

    public static Cookies = class <
        InputSchema extends SchemaTypes.FlatSchema,
        ReturnableData = SchemaTypes.ParsedSchema<InputSchema>
    > extends Schema<InputSchema, ReturnableData> {
        public readonly _type: 'cookies' = 'cookies';
        public constructor(schema: InputSchema) { super(schema); };
    }


    
    private static _walk = async (
        schema: SchemaTypes.InputSchema | SchemaTypes.FlatSchema,
        data: object,
        path: string[] = [],
        result: { [key: string]: unknown } = {}
    ) => {
        for (const key in schema) {

            // -- Check if the key is missing
            const value = schema[key],
                new_path = path.concat(key),
                new_data = data[key];

                

            // -- check if the value is a constructor: SchemaTypes.GenericTypeConstructor
            if (typeof value === 'function') {
                
                // -- If it's a constructor, execute it
                const validator_result = await execute(
                    value as SchemaTypes.GenericTypeConstructor, 
                    new_data
                );

                // -- If the result is an error, return it
                if (validator_result instanceof GenericErrorTypes.GenericErrorLike) {
                    validator_result.data = { 
                        path: new_path,
                        expected: value.name
                    };
                    return validator_result;
                }
                else result[key] = validator_result;
            }
            

            
            // -- If the value is an object, walk it
            else if (typeof value === 'object') {
                const walk_result = await Schema._walk(value, new_data, new_path);
                if (walk_result instanceof GenericErrorTypes.GenericErrorLike) return walk_result;
                result[key] = walk_result;
            }
        }

        return result;
    };



    /**
     * @name validate
     * @description Takes a data object and validates it against the schema
     * returns the validated data or an error depending on the result
     * 
     * @param {object} data - The data to validate against the schema
     * @returns 
     */
    public validate = async (
        data: object
    ): Promise<ReturnableData> => new Promise(async (resolve, reject) => {
        try {
            const result = await Schema._walk(this._schema, data);
            if (result instanceof GenericErrorTypes.GenericErrorLike) return reject(result);
            return resolve(result as ReturnableData);
        }

        catch (error) {
            reject(new SchemaExecutionError(`An error occurred trying to validate ${this._id}`));
        }
    });



    public get id(): string { return this._id; }
    public get schema(): InputSchema { return this._schema; }
};