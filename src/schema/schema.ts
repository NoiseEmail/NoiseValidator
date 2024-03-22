import { randomUUID } from 'crypto';
import { Schema as SchemaTypes } from './types.d';
import { GenericError } from '../error';
import { SchemaExecutionError, SchemaMissingFieldError } from './errors';
import { execute } from './generic';
import { LogObject } from '../logger/types';
import { Log } from '..';



export default class Schema<
    InputSchema extends SchemaTypes.InputSchema | SchemaTypes.FlatSchema,
    ReturnableData = SchemaTypes.ParsedSchema<InputSchema>
> {
    public readonly _return_type: ReturnableData = {} as ReturnableData;    
    public readonly _type: 'body' | 'query' | 'headers' | 'cookies' = 'body';
    public readonly _id: string = randomUUID();
    public readonly _schema: InputSchema;

    private _log_stacks: Array<LogObject>;
    private _errors: Array<GenericError>;

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


    
    private static _walk = async <ReturnableData>(
        instance: Schema<any, any>,
        schema: SchemaTypes.InputSchema | SchemaTypes.FlatSchema,
        data: object,
        path: string[] = [],
        result: { [key: string]: unknown } = {}
    ): Promise<ReturnableData | GenericError> => {
        for (const key in schema) {

            // -- Check if the key is missing
            const value = schema[key],
                new_path = path.concat(key),
                new_data = (data instanceof Object) ? data[key] : data;


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
                if (new_data === undefined && validator_result.is_error) {
                    const error = new SchemaMissingFieldError(new_path);
                    instance.push_error(error);
                    return error;
                }

                // -- If the result is an error, return it
                else if (validator_result.is_error) {

                    let thrown_error: GenericError = validator_result.result as GenericError;
                    thrown_error.data = { 
                        path: new_path,
                        expected: value.name
                    };
                    instance.push_error(thrown_error);
                    return thrown_error;
                }

                // -- If the validator_result is not an error, add it to the result
                else result[key] = validator_result.result;
            }
            

            
            // -- If the value is an object, walk it
            else if (typeof value === 'object') {
                const walk_result = await Schema._walk(instance, value, new_data, new_path);

                if (walk_result instanceof Error) {
                    const error = GenericError.from_unknown(walk_result);
                    error.data = {
                        path: new_path,
                        expected: value.constructor.name
                    };

                    instance.push_error(error);
                    return error;
                };
                
                result[key] = walk_result;
            }
        }

        return result as ReturnableData;
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
            const result = await Schema._walk<ReturnableData>(this, this._schema, data);

            // -- Error
            if (result instanceof Error) {
                const error = GenericError.from_unknown(result);
                error.data = { schema: this._id };
                return resolve({ type: 'error', error });
            }

            // -- Success
            else return resolve({ type: 'data', data: result });
        }

        catch (unknown_error) {
            Log.debug(`An error occurred trying to validate ${this._id}`);

            // -- Convert anything to a generic error
            const error = GenericError.from_unknown(
                unknown_error,
                new SchemaExecutionError(`An error occurred trying to validate ${this._id}`)
            );  
            
            error.data = { schema: this._id };
            this.errors.forEach((error) => error.add_error(error));
            this.push_error(error);
            return resolve({ type: 'error', error });
        }
    });



    public get id(): string { return this._id; };
    public get schema(): InputSchema { return this._schema; };
    public set_log_stack = (log_stack: Array<LogObject>) => this._log_stacks.push(...log_stack);
    public get log_stack(): Array<LogObject> { return this._log_stacks; };

    public get errors(): Array<GenericError> { return this._errors; };
    protected push_error = (error: GenericError) => this._errors.push(error);
};