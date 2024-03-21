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

    protected handler = async (): Promise<Array<ReturnType>> => {

        // -- Make sure the value is an array to begin with
        if (!Array.isArray(this.value)) 
            throw this.invalid('Invalid array');


        // -- Else, loop through the array and execute the constructor
        //    for each value in the array
        const results: Array<ReturnType> = [];
        for (const value of this.value) {
            const instance = new constructor(value,
                (error) => {
                    this.invalid(error);
                    throw error; // -- This will break the loop
                },
                (value) => results.push(value)
            );

            await instance.execute();
        }


        // -- Return the results
        return results;
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