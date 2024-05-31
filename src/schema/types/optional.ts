import GenericType from '../generic';
import { GenericError } from '@error';
import { SchemaNamespace } from '../types.d';



type ExtractReturnType<
    DefaultValue,
    OriginalReturnType,
> = DefaultValue extends undefined ?
    OriginalReturnType | undefined : OriginalReturnType;



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
    OriginalReturnType,
    OriginalInputShape,
    DefaultValue extends OriginalReturnType | undefined,
>(
    constructor: SchemaNamespace.GenericTypeConstructor<
        OriginalReturnType, 
        OriginalInputShape
    >,
    default_value: DefaultValue = undefined as DefaultValue
) => (class OptionalClass extends GenericType<
    ExtractReturnType<DefaultValue, OriginalReturnType>,
    OriginalInputShape
> { 
    protected readonly _default_value: ExtractReturnType<
        DefaultValue, 
        OriginalReturnType
    > | undefined = default_value;

    constructor(
        input_value: unknown,
        on_invalid: (error: GenericError) => void,
        on_valid: (result: ExtractReturnType<DefaultValue, OriginalReturnType>) => void,
        default_value?: DefaultValue
    ) {
        super(input_value, on_invalid, on_valid);

        if (default_value !== undefined) 
            this._default_value = default_value;
    }



    protected validate_optional = (): Promise<
        ExtractReturnType<DefaultValue, OriginalReturnType> | 
        GenericError
    > => new Promise((resolve) => {
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

    

    // TODO: Figure out why the return type dose not want to work
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
})

export default create_optional;