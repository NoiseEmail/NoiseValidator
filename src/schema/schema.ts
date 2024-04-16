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


    
    public static _execute_validator = async (
        instance: Schema<any, any>,
        value: SchemaTypes.GenericTypeConstructor,
        new_data: unknown,
        new_path: string[]
    ): Promise<unknown | GenericError> => {

        // -- If it's a constructor, execute it
        const validator_result = await execute(value, new_data);
        instance.set_log_stack(validator_result.instance.log_stack);


        // -- If the result is an error and theres no new data, return a missing field error
        //    as if the data was optional, it would not throw an error
        if (
            new_data === undefined && 
            validator_result.is_error
        ) {
            const error = new SchemaMissingFieldError(new_path);
            error.hint = 'Field is missing';
            error.data = { 
                path: new_path, 
                expected: value.name
            };

            instance.push_error(error);
            return error;
        }


        // -- If the result is an error, return it
        else if (validator_result.is_error) {
            const thrown_error = GenericError.from_unknown(validator_result.result);
            thrown_error.hint = 'Error occurred while validating the schema';
            thrown_error.data = { 
                path: new_path,
                expected: value.name
            };
            
            instance.push_error(thrown_error);
            return thrown_error;
        }


        // -- If the validator_result is not an error, add it to the result
        else return validator_result.result;
    };



    public static _validate_value = async (
        instance: Schema<any, any>,
        validator: SchemaTypes.InputSchema | SchemaTypes.GenericTypeConstructor<any, any>,
        new_data: unknown,
        new_path: string[]
    ): Promise<unknown | GenericError> => {

        switch (typeof validator) {
            // -- Function, execute it
            case 'function': {
                const walk_result = await Schema._execute_validator(
                    instance, 
                    validator as SchemaTypes.GenericTypeConstructor, 
                    new_data, 
                    new_path
                );

                if (walk_result instanceof Error) {
                    const error = GenericError.from_unknown(walk_result);
                    error.hint = 'Error occurred while validating the schema';
                    error.data = { 
                        path: new_path, 
                        expected: validator.constructor.name 
                    };
                    instance.push_error(error);
                    return error;
                };

                return walk_result;
            }


            
            // -- Object, walk it
            case 'object': {
                const walk_result = await Schema._walk_object(
                    instance, 
                    validator,
                    new_data,
                    new_path
                );
                
                if (walk_result instanceof Error) {
                    const error = GenericError.from_unknown(walk_result);
                    error.hint = 'Error occurred while validating the schema';
                    error.data = { 
                        path: new_path, 
                        expected: validator.constructor.name 
                    };
                    instance.push_error(error);
                    return error;
                };
                
                return walk_result;
            }
        }
    };
    


    public static _walk_object = async <ReturnableData>(
        instance: Schema<any, any>,
        schema: SchemaTypes.InputSchema | SchemaTypes.FlatSchema,
        data: unknown,
        path: string[] = [],
        result: { [type: string]: unknown } = {}
    ): Promise<ReturnableData | GenericError> => {

        for (const type in schema) {

            const validator = schema[type];
            const new_path = path.concat(type);
            const new_data = 
                (data instanceof Object) ?  // -- Is the data an object?
                (data as { [type: string]: unknown })[type.toString()] : // -- Get the value at the key
                data; // -- If not an object, just use the data



            // -- Ensure that the passed in data is not a function
            //    this should never happen, but just in case
            if (new_data instanceof Function) {
                const error = new SchemaExecutionError(`The value at ${new_path.join('.')} is a function`);
                instance.push_error(error);
                return error;
            }

            // -- Check the value against the schema
            const walk_result = await Schema._validate_value(
                instance,
                validator,
                new_data,
                new_path
            );

            // -- If the result is an error, break the loop
            if (walk_result instanceof Error) {
                const error = GenericError.from_unknown(walk_result);
                error.hint = 'Error occurred while validating the schema';
                error.data = { 
                    path: new_path, 
                    expected: validator.constructor.name 
                };
                instance.push_error(error);
                return error;
            }

            // -- Else, add the result to the return object
            result[type] = walk_result;
        }
    
        return result as ReturnableData;
    };


    
    public static _walk = async <ReturnableData>(
        instance: Schema<any, any>,
        schema: SchemaTypes.InputSchema | SchemaTypes.FlatSchema,
        data: object,
        path: string[] = [],
        result: { [key: string]: unknown } = {}
    ): Promise<ReturnableData | GenericError> => 
        Schema._walk_object(instance, schema, data, path, result);
    


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

            // -- Convert anything to a generic error
            const error = GenericError.from_unknown(
                unknown_error,
                new SchemaExecutionError(`An error occurred trying to validate ${this._id}`)
            );      

            Log.debug(`Schema validate: An error occurred trying to validate ${this._id}: ${error.id}`);
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