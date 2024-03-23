import { GenericError } from '../../error';
import GenericType from '../generic';
import { Schema } from '../types';



const ArrayType = <
    Constructor extends Schema.GenericTypeConstructor<any>,
    ReturnType = Schema.ExtractParamaterReturnType<Constructor>,
    InputShape = Schema.ExtractParamaterInputShape<Constructor>
>(
    constructor: Constructor
) => class ArrayClass extends GenericType<
    Array<ReturnType>, InputShape | undefined
> {
    constructor(
        input_value: unknown,
        on_invalid: (error: GenericError) => void,
        on_valid: (result: Array<ReturnType>) => void,
    ) {
        super(input_value, on_invalid, on_valid);
    }

    protected handler = async (): Promise<any> => {

        try {
            // -- Make sure the value is an array to begin with
            if (!Array.isArray(this.value)) 
                throw new GenericError('Invalid array, must be an array', 400);


            // -- Else, loop through the array and execute the constructor
            //    for each value in the array
            const results: Array<ReturnType> = [];
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
}



const create_array: <T>(
    constructor: Schema.GenericTypeConstructor<T>
) => new (
    input_value: unknown,
    on_invalid: (error: GenericError) => void,
    on_valid: (result: Array<T> | undefined) => void,
) => GenericType<Array<T>> = ArrayType;



export default create_array;