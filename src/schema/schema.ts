import Log from 'noise_validator/src/logger';
import { GenericError } from 'noise_validator/src/error';
import { LogObject } from 'noise_validator/src/logger/types';
import { InvalidInputError, SchemaExecutionError, SchemaMissingFieldError } from './errors';
import { SchemaNamespace } from './types.d';
import { v4 as uuidv4 } from 'uuid';



export default class Schema<
    NestedSchema extends SchemaNamespace.NestedSchema | SchemaNamespace.FlatSchema,
    ReturnableData = SchemaNamespace.ParsedSchema<NestedSchema>
> {
    public readonly _return_type: ReturnableData = {} as ReturnableData;    
    public readonly _id: string = uuidv4();
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


    
    public static async _execute_validator(
        instance: Schema<SchemaNamespace.NestedSchema | SchemaNamespace.FlatSchema, unknown>,
        value: SchemaNamespace.GenericTypeConstructor,
        new_data: unknown,
        new_path: string[]
    ): Promise<unknown> {

        // -- If it's a constructor, execute it
        const validator_instance = new value(new_data);
        const validator_result = await validator_instance.execute();


        // -- If the result is an error and theres no new data, return a missing field error
        //    as if the data was optional, it would not throw an error
        if (
            new_data === undefined && 
            validator_result.success === false
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
        else if (validator_result.success === false) {
            let thrown_error = GenericError.from_unknown(validator_result.data);
            thrown_error = new InvalidInputError(`${new_path.join(', ')}: ${thrown_error.message}`)
            thrown_error.hint = 'Error occurred while validating the schema';
            thrown_error.data = { 
                path: new_path,
                expected: value.name
            };
            
            instance.push_error(thrown_error);
            throw thrown_error;
        }


        // -- If the validator_result is not an error, add it to the result
        else return validator_result.data as unknown;
    };



    public static async _validate_value(
        instance: Schema<SchemaNamespace.NestedSchema | SchemaNamespace.FlatSchema, unknown>,
        validator: SchemaNamespace.NestedSchema | SchemaNamespace.GenericTypeConstructor<unknown, unknown> | SchemaNamespace.SchemaLike,
        new_data: unknown,
        new_path: string[]
    ): Promise<unknown> {

        const type: 'function' | 'object' | 'class' = 
            validator instanceof Schema ? 'class' : 
            typeof validator === 'object' ? 'object' : 'function';

        switch (type) {
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



            // -- Nested schema
            case 'class': {

                const schema = validator as SchemaNamespace.SchemaLike;
                let result: unknown;

                try { result = await schema.validate(new_data); }
                catch (unknown_error) {
                    const error = GenericError.from_unknown(unknown_error);
                    error.hint = 'Error occurred while validating the schema';
                    error.data = { 
                        path: new_path, 
                        expected: validator.constructor.name 
                    };
                    instance.push_error(error);
                    throw error;
                }

                return result;
            }



            // -- Object, walk it
            case 'object': {
                const walk_result = await Schema._walk_object(                    
                    instance, 
                    validator as SchemaNamespace.NestedSchema,
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
    


    public static async _walk_object<ReturnableData>(
        instance: Schema<SchemaNamespace.NestedSchema | SchemaNamespace.FlatSchema, unknown>,
        schema: SchemaNamespace.NestedSchema | SchemaNamespace.FlatSchema,
        data: unknown,
        path: string[] = [],
        result: { [type: string]: unknown } = {}
    ): Promise<ReturnableData> {

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


    
    public static async _walk<ReturnableData>(
        instance: Schema<SchemaNamespace.NestedSchema | SchemaNamespace.FlatSchema, unknown>,
        schema: SchemaNamespace.NestedSchema | SchemaNamespace.FlatSchema,
        data: unknown,
        path: string[] = [],
        result: { [key: string]: unknown } = {}
    ): Promise<ReturnableData> { return await Schema._walk_object(instance, schema, data, path, result); };
    


    /**
     * @name validate
     * @description Takes a data object and validates it against the schema
     * returns the validated data or an error depending on the result
     * 
     * @param {object} data - The data to validate against the schema
     * @returns 
     */
    public async validate(
        data: unknown
    ): Promise<ReturnableData> {

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
    public get errors(): Array<GenericError> { return this._errors; };
    protected push_error(error: GenericError): void { this._errors.push(error); };
};