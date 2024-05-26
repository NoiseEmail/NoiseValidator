import { GenericError } from '@error';
import GenericType from '../generic';
import { SchemaNamespace } from '../types';



const create_array = <
    OriginalReturnType,
    OriginalInputShape,
>(
    constructor: SchemaNamespace.GenericTypeConstructor<
        OriginalReturnType, 
        OriginalInputShape
    >,
) => (class OptionalClass extends GenericType<
    Array<OriginalReturnType>,
    OriginalInputShape
> { 
    constructor(
        input_value: unknown,
        on_invalid: (error: GenericError) => void,
        on_valid: (result: Array<OriginalReturnType>) => void,
    ) {
        super(input_value, on_invalid, on_valid);
    }


    
    // TODO: Figure out why the return type dose not want to work
    protected handler = async (): Promise<any> => {

        try {
            // -- Make sure the value is an array to begin with
            if (!Array.isArray(this.value)) 
                throw new GenericError('Invalid array, must be an array', 400);


            // -- Else, loop through the array and execute the constructor
            //    for each value in the array
            const results: Array<OriginalReturnType> = [];
            for (const value of this.value) {
                const instance = new constructor(value,
                    (unknown_error) => {
                        const error = GenericError.from_unknown(
                            unknown_error, 
                            new GenericError('Error in array handler', 500)
                        );

                        error.hint = 'Error occurred while processing array';
                        throw error;
                    },
                    (value) => results.push(value)
                );

                await instance.execute();
            }


            // -- Return the results
            return results;
        }


        catch (unknown_error) {
            return this.invalid(GenericError.from_unknown(
                unknown_error, 
                new GenericError('Unknown error occurred in array handler', 500)
            ));
        }
    }



    public static get name() {
        return `Array<${constructor.name}>`;
    }
})


export default create_array;