import { GenericError } from '../../error';
import GenericType from '../generic';
import { Schema } from '../types.d';



const Optional = <
    Constructor extends Schema.GenericTypeConstructor<any>,
    ReturnType = Schema.ExtractParamaterReturnType<Constructor>,
    InputShape = Schema.ExtractParamaterInputShape<Constructor>
>(
    constructor: Constructor
) => class OptionalClass extends GenericType<
    ReturnType | undefined | void, InputShape
> {
    constructor(
        input_value: unknown,
        on_invalid: (error: GenericError) => void,
        on_valid: (result: ReturnType | undefined | void) => void,
    ) {
        super(input_value, on_invalid, on_valid);
    }

    protected handler = async (): Promise<any> => {
        try {

            // -- If the value is not provided, return undefined
            if (
                this.value === undefined ||
                this.value === null ||
                this.value === void 0
            ) return undefined;


            // -- Attempt to execute the original constructor 
            const instance = new constructor(this.value,
                (unknown_error) => {
                    const error = GenericError.from_unknown(
                        unknown_error, 
                        new GenericError('Error in Optional handler', 500)
                    );

                    error.hint = 'Error occurred while processing the optional value';
                    throw error;
                },
                (value) => this.valid(value)
            );


            // -- Execute the constructor and check if it is valid
            await instance.execute();
        }

        catch (unknown_error) {
            return this.invalid(GenericError.from_unknown(
                unknown_error, 
                new GenericError('Unknown error occurred in optional handler', 500)
            ));
        }
    }

    public static get name() {
        return `Optional<${constructor.name}>`;
    }
}



/**
 * @description This is a wrapper for any generic type that makes it optional
 * it will return undefined if the input value is undefined.
 * 
 * If the input value is not undefined, it will execute the constructor, if 
 * that constructor returns a valid value, it will return that value.
 * 
 * If the value is not undefined, and the constructor returns an invalid value,
 * it will return an error like any other generic type.
 * 
 * @param {GenericTypeConstructor} constructor - The constructor to wrap
 * 
 * @returns {OptionalClass} A class that wraps the constructor
 */
const create_optional: <T>(
    constructor: Schema.GenericTypeConstructor<T>
) => new (
    input_value: unknown,
    on_invalid: (error: GenericError) => void,
    on_valid: (result: T | undefined | void | null) => void,
) => GenericType<T | undefined | void | null> = Optional;



export default create_optional;