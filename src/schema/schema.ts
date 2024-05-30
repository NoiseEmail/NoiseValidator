import Log from '@logger';
import { execute } from './generic';
import { GenericError } from '@error';
import { LogObject } from '@/logger/types';
import { randomUUID } from 'crypto';
import { SchemaExecutionError, SchemaMissingFieldError } from './errors';
import { SchemaNamespace } from './types';



export default class Schema<
    NestedSchema extends SchemaNamespace.NestedSchema | SchemaNamespace.FlatSchema,
    ReturnableData = SchemaNamespace.ParsedSchema<NestedSchema>
> {
    public readonly _return_type: ReturnableData = {} as ReturnableData;    
    public readonly _type: 'body' | 'query' | 'headers' | 'cookies' = 'body';
    public readonly _id: string = randomUUID();
    public readonly _schema: NestedSchema;

    private _log_stacks: Array<LogObject>;
    private _errors: Array<GenericError>;

    public constructor(
        schema: NestedSchema
    ) {
        this._schema = schema;
        this._log_stacks = [];
        this._errors = [];
    };


    
    public static _execute_validator = async (
        instance: Schema<SchemaNamespace.NestedSchema | SchemaNamespace.FlatSchema, unknown>,
        value: SchemaNamespace.GenericTypeConstructor,
        new_data: unknown,
        new_path: string[]
    ): Promise<unknown> => {

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
            throw error;
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
            throw thrown_error;
        }


        // -- If the validator_result is not an error, add it to the result
        else return validator_result.result as unknown;
    };



    public static _validate_value = async (
        instance: Schema<SchemaNamespace.NestedSchema | SchemaNamespace.FlatSchema, unknown>,
        validator: SchemaNamespace.NestedSchema | SchemaNamespace.GenericTypeConstructor<unknown, unknown>,
        new_data: unknown,
        new_path: string[]
    ): Promise<unknown> => {

        switch (typeof validator) {
            // -- Function, execute it
            case 'function': {
                const walk_result = await Schema._execute_validator(
                    instance, 
                    validator as SchemaNamespace.GenericTypeConstructor, 
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
                    throw error;
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
                    throw error;
                };
                
                return walk_result;
            }
        }
    };
    


    public static _walk_object = async <ReturnableData>(
        instance: Schema<SchemaNamespace.NestedSchema | SchemaNamespace.FlatSchema, unknown>,
        schema: SchemaNamespace.NestedSchema | SchemaNamespace.FlatSchema,
        data: unknown,
        path: string[] = [],
        result: { [type: string]: unknown } = {}
    ): Promise<ReturnableData> => {

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
                throw error;
            }



            try {
                // -- Attempt to validate the value
                result[type] = await Schema._validate_value(
                    instance,
                    validator,
                    new_data,
                    new_path
                );
            }



            catch (unknown_error) {
                const error = GenericError.from_unknown(
                    unknown_error, 
                    new SchemaExecutionError(`An error occurred trying to validate ${new_path.join('.')}`)
                );
                error.hint = 'Error occurred while validating the schema';
                error.data = { 
                    path: new_path, 
                    expected: validator.constructor.name 
                };
                instance.push_error(error);
                throw error;
            }
        }
    
        return result as ReturnableData;
    };


    
    public static _walk = async <ReturnableData>(
        instance: Schema<SchemaNamespace.NestedSchema | SchemaNamespace.FlatSchema, unknown>,
        schema: SchemaNamespace.NestedSchema | SchemaNamespace.FlatSchema,
        data: unknown,
        path: string[] = [],
        result: { [key: string]: unknown } = {}
    ): Promise<ReturnableData> => 
        await Schema._walk_object(instance, schema, data, path, result);
    


    /**
     * @name validate
     * @description Takes a data object and validates it against the schema
     * returns the validated data or an error depending on the result
     * 
     * @param {object} data - The data to validate against the schema
     * @returns 
     */
    public validate = async (
        data: unknown
    ): Promise<ReturnableData> => {

        try {
            // -- Try to walk the schema
            const result = await Schema._walk<ReturnableData>(this, this._schema, data);
            if (result instanceof Error) throw result;

            // -- Success
            else return result;
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
            throw error;
        }
    };



    public get id(): string { return this._id; };
    public get schema(): NestedSchema { return this._schema; };
    public set_log_stack = (log_stack: Array<LogObject>) => this._log_stacks.push(...log_stack);
    public get log_stack(): Array<LogObject> { return this._log_stacks; };

    public get errors(): Array<GenericError> { return this._errors; };
    protected push_error = (error: GenericError) => this._errors.push(error);
};