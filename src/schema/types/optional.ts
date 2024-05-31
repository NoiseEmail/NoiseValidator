import GenericType from '../generic';
import { GenericError } from 'noise_validator/src/error';
import { SchemaNamespace } from '../types.d';



type ExtractReturnType<
    DefaultValue,
    OriginalReturnType,
> = DefaultValue extends undefined ?
    OriginalReturnType | undefined : OriginalReturnType;



class OptionalTypeClass<
    OriginalReturnType,
    OriginalInputShape,
    DefaultValue extends OriginalReturnType | undefined,
> extends GenericType<
    ExtractReturnType<DefaultValue, OriginalReturnType> | undefined,
    OriginalInputShape
> { 
    _default_value: ExtractReturnType<DefaultValue, OriginalReturnType> | undefined;
    _original_constructor: SchemaNamespace.GenericTypeConstructor<OriginalReturnType, OriginalInputShape>;
    _input_value: OriginalInputShape;

    constructor(
        input_value: unknown,
        original_constructor: SchemaNamespace.GenericTypeConstructor<OriginalReturnType, OriginalInputShape>,
        default_value?: DefaultValue
    ) {
        super(input_value);
        this._default_value = default_value;
        this._input_value = input_value as OriginalInputShape;
        this._original_constructor = original_constructor;
    }

    

    handler = async (): Promise<ExtractReturnType<DefaultValue, OriginalReturnType> | undefined> => {
        try {

            // -- If the value is not provided, return undefined
            if (
                this.value === undefined ||
                this.value === null ||
                this.value === void 0
            ) {
                // -- Check if a default value is provided
                if (this._default_value !== undefined) return this._default_value;

                // -- If no default value is provided, return undefined
                else return undefined;
            };


            // -- Attempt to execute the original constructor 
            const instance = new this._original_constructor(this._input_value)
            const result = await instance.execute();
            if (result.success === true) return result.data;
            throw result.data;
        }

        catch (unknown_error) {
            throw GenericError.from_unknown(
                unknown_error, 
                new GenericError('Unknown error occurred in optional handler', 500)
            );
        }
    }

    public static get name() {
        return `Optional<${this.constructor.name}>`;
    }
};



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
) => (class extends OptionalTypeClass<
    OriginalReturnType,
    OriginalInputShape,
    DefaultValue
> {
    constructor(
        input_value: unknown,
    ) {
        super(input_value, constructor, default_value);
    }
});



export default create_optional;