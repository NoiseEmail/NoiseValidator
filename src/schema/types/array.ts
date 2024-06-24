import GenericType from '../generic';
import { GenericError } from 'noise_validator/src/error';
import { SchemaNamespace } from '../types.d';
import Schema from '../schema';



class OptionalClass<
    OriginalReturnType,
    OriginalInputShape,
> extends GenericType<
    Array<OriginalReturnType>,
    OriginalInputShape
> { 

    _input_value: unknown;
    _original_constructor: 
        SchemaNamespace.GenericTypeConstructor<OriginalReturnType, OriginalInputShape> |
        SchemaNamespace.SchemaLike;

    constructor(
        input_value: unknown,
        original_constructor: 
            SchemaNamespace.GenericTypeConstructor<OriginalReturnType, OriginalInputShape> |
            SchemaNamespace.SchemaLike
    ) {
        super(input_value);
        this._input_value = input_value;
        this._original_constructor = original_constructor;
    }



    public async _validate_data(data: unknown): Promise<OriginalReturnType> {
        switch (this._original_constructor instanceof Schema) {
            case true: {
                const schema = this._original_constructor as SchemaNamespace.SchemaLike<OriginalReturnType>;
                const validated_data = await schema.validate(data);
                return validated_data;
            }

            case false: {
                const constructor = this._original_constructor as SchemaNamespace.GenericTypeConstructor<OriginalReturnType, OriginalInputShape>;
                const instance = new constructor(data);
                const result = await instance.execute();
                if (result.success === true) return result.data;
                else throw result.data;
            }
        }
    };  


    
    public async handler(): Promise<Array<OriginalReturnType>> {
        try {
            // -- Make sure the value is an array to begin with
            if (!Array.isArray(this.value)) 
                throw new GenericError('Invalid array, must be an array', 400);

            const results: Array<OriginalReturnType> = [];
            for (const value of this.value) {

                // -- Validate the data
                try {
                    const validated_data = await this._validate_data(value);
                    results.push(validated_data);
                }

                // -- Add a hint if it fails
                catch (unkown_error) {
                    const error = GenericError.from_unknown(unkown_error);
                    error.hint = 'Error occurred while validating the schema';
                    error.data = { expected: this.constructor.name, value: value };
                    throw error;
                }
            }

            // -- Return the results
            return results;
        }


        catch (unknown_error) {
            throw GenericError.from_unknown(
                unknown_error, 
                new GenericError('Unknown error occurred in array handler', 500)
            );
        }
    };



    public static get name() {
        return `Array<${this.constructor.name}>`;
    };
};


const create_array = <
    OriginalReturnType,
    OriginalInputShape,
>(
    constructor: SchemaNamespace.GenericTypeConstructor<
        OriginalReturnType, 
        OriginalInputShape
    > | OriginalReturnType,
) => (class extends OptionalClass<
    OriginalReturnType extends SchemaNamespace.SchemaLike ? 
        SchemaNamespace.ReturnType<OriginalReturnType> : 
        OriginalReturnType, 

    OriginalInputShape
> {
    constructor(input_value: unknown) {
        super(
            input_value, 
            constructor as SchemaNamespace.SchemaLike
        );
    }
});



export default create_array;