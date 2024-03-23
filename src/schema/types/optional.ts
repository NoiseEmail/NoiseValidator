import { GenericError } from '../../error';
import GenericType from '../generic';
import { Schema } from '../types.d';



const Optional = <

    Constructor extends Schema.GenericTypeConstructor,
    OriginalReturnType extends Schema.ExtractParamaterReturnType<Constructor>,
    OriginalInputShape extends Schema.ExtractParamaterInputShape<Constructor>,

    DefaultValue extends OriginalReturnType | undefined,
    ReturnType = DefaultValue extends undefined ? OriginalReturnType | undefined : OriginalReturnType,
>(
    constructor: Constructor
) => class OptionalClass extends GenericType<
    ReturnType, 
    OriginalInputShape
> { 
    private readonly _default_value: ReturnType | undefined;

    constructor(
        input_value: unknown,
        on_invalid: (error: GenericError) => void,
        on_valid: (result: ReturnType) => void,
        default_value?: DefaultValue
    ) {
        super(input_value, on_invalid, on_valid);

        if (default_value !== undefined) 
            this._default_value = default_value;
    }



    private validate_optional = (): Promise<ReturnType | GenericError> => new Promise((resolve) => {
        try {
            const instance = new constructor(this._default_value,
                (unknown_error) => {
                    const error = GenericError.from_unknown(
                        unknown_error, 
                        new GenericError('Error in Optional handler', 500)
                    );
    
                    error.hint = 'Error occurred while processing the optional defualt value';
                    resolve(error);
                },
                (value) => resolve(value)
            );
    
            // -- Execute the constructor and check if it is valid
            instance.execute();
        }

        catch (unknown_error) {
            resolve(GenericError.from_unknown(
                unknown_error, 
                new GenericError('Unknown error occurred in optional handler', 500)
            ));
        }
    });



    protected handler = async (): Promise<any> => {
        try {
            // -- If the value is not provided, return undefined
            if (
                this.value === undefined ||
                this.value === null ||
                this.value === void 0
            ) {

                // -- Check if a default value is provided
                if (this._default_value !== undefined) {
                    const default_value = await this.validate_optional();
                    if (default_value instanceof GenericError) throw default_value;
                    return this.valid(default_value);
                }

                else return;
            };


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
const create_optional = <

    Constructor extends Schema.GenericTypeConstructor,
    OriginalReturnType extends Schema.ExtractParamaterReturnType<Constructor>,
    OriginalInputShape extends Schema.ExtractParamaterInputShape<Constructor>,

    DefaultValue extends OriginalReturnType | undefined,
    ReturnType = DefaultValue extends undefined ? OriginalReturnType | undefined : OriginalReturnType,
>(
    constructor: Constructor,
    default_value?: DefaultValue,
) => class OptionalClass extends Optional<
    Constructor, 
    OriginalReturnType, 
    OriginalInputShape, 
    DefaultValue, 
    ReturnType
>(
    constructor
) {
    constructor(
        input_value: unknown,
        on_invalid: (error: GenericError) => void,
        on_valid: (result: ReturnType) => void,
    ) {
        super(input_value, on_invalid, on_valid, default_value);
    }
}



export default create_optional;