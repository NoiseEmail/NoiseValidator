import { randomUUID } from 'crypto';
import { Schema as SchemaTypes } from './types.d';
import { GenericError as GenericErrorTypes } from '../error/types.d';
import { SchemaExecutionError, SchemaMissingFieldError } from './errors';
import { execute } from './generic';
import { LogObject } from '../logger/types';
import { GenericError } from '../error';



export default class Schema<
    InputSchema extends SchemaTypes.InputSchema | SchemaTypes.FlatSchema,
    ReturnableData = SchemaTypes.ParsedSchema<InputSchema>
> {
    public readonly _return_type: ReturnableData = {} as ReturnableData;    
    public readonly _type: 'body' | 'query' | 'headers' | 'cookies' = 'body';
    public readonly _id: string = randomUUID();
    public readonly _schema: InputSchema;

    private _log_stacks: Array<LogObject>;
    private _errors: Array<GenericErrorTypes.GenericErrorLike>;

    private constructor(
        schema: InputSchema
    ) {
        this._schema = schema;
        this._log_stacks = [];
        this._errors = [];
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
        instance: Schema<any, any>,
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


            // -- If new data is a function, ista error
            if (new_data instanceof Function) {
                const error = new SchemaExecutionError(`The value at ${new_path.join('.')} is a function`);
                instance.push_error(error);
                return error;
            }

                

            // -- check if the value is a constructor: SchemaTypes.GenericTypeConstructor
            if (typeof value === 'function') {
                
                // -- If it's a constructor, execute it
                let validator_result = await execute(
                    value as SchemaTypes.GenericTypeConstructor, 
                    new_data
                );

                // -- Add the log stack to the schema
                instance.set_log_stack(validator_result.instance.log_stack);

                // -- If the result is an error and theres no new data, return a missing field error
                //    as if the data was optional, it would not throw an error
                if (new_data === undefined && GenericError.is_generic_error(validator_result.result)) {
                    const error = new SchemaMissingFieldError(new_path);
                    instance.push_error(error);
                    return error;
                }

                // -- If the result is an error, return it
                else if (GenericError.is_generic_error(validator_result.result)) {
                    (validator_result.result as GenericError).data = { 
                        path: new_path,
                        expected: value.name
                    };
                    instance.push_error(validator_result.result as GenericError);
                    return validator_result;
                }

                // -- If the validator_result is not an error, add it to the result
                else result[key] = validator_result.result;
            }
            

            
            // -- If the value is an object, walk it
            else if (typeof value === 'object') {
                const walk_result = await Schema._walk(instance, value, new_data, new_path);
                if (GenericError.is_generic_error(walk_result)) {
                    walk_result.data = {
                        path: new_path,
                        expected: value.constructor.name
                    };
                    instance.push_error(walk_result);
                    return walk_result
                };
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
    ): SchemaTypes.SchemaValidateReturnable<ReturnableData> => new Promise(async (resolve) => {

        try {
            // -- Try to walk the schema
            const result = await Schema._walk(this, this._schema, data);

            // -- Error
            if (GenericError.is_generic_error(result)) return resolve({
                type: 'error',
                error: result
            });

            // -- Success
            else return resolve({
                type: 'data',
                data: result
            });
        }

        catch (error) {

            // -- Error
            const error_ = new SchemaExecutionError(`An error occurred trying to validate ${this._id}`);
            this._errors.push(error_);
            return resolve({
                type: 'error',
                error: error_
            });
        }
    });



    public get id(): string { return this._id; };
    public get schema(): InputSchema { return this._schema; };
    public set_log_stack = (log_stack: Array<LogObject>) => this._log_stacks.push(...log_stack);
    public get log_stack(): Array<LogObject> { return this._log_stacks; };
    protected push_error = (error: GenericErrorTypes.GenericErrorLike) => this._errors.push(error);
};