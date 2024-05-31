import GenericType from '../generic';
import { GenericError } from 'noise_validator/src/error';
import { SchemaNamespace } from '../types.d';



class OptionalClass<
    OriginalReturnType,
    OriginalInputShape,
> extends GenericType<
    Array<OriginalReturnType>,
    OriginalInputShape
> { 

    _input_value: unknown;
    _original_constructor: SchemaNamespace.GenericTypeConstructor<OriginalReturnType, OriginalInputShape>;

    constructor(
        input_value: unknown,
        original_constructor: SchemaNamespace.GenericTypeConstructor<OriginalReturnType, OriginalInputShape>,
    ) {
        super(input_value);
        this._input_value = input_value;
        this._original_constructor = original_constructor;
    }


    
    public async handler(): Promise<Array<OriginalReturnType>> {
        try {
            // -- Make sure the value is an array to begin with
            if (!Array.isArray(this.value)) 
                throw new GenericError('Invalid array, must be an array', 400);

            const results: Array<OriginalReturnType> = [];
            for (const value of this.value) {
                const instance = new this._original_constructor(value);
                const result = await instance.execute();
                if (result.success === true) results.push(result.data);
                else throw result.data;
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
    >,
) => (class extends OptionalClass<OriginalReturnType, OriginalInputShape> {
    constructor(input_value: unknown) {
        super(input_value, constructor);
    }
});



export default create_array;