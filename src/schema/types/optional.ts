import GenericType from '../generic';
import { GenericError } from 'noise_validator/src/error';
import { SchemaNamespace } from '../types.d';
import Schema from '../schema';



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
    _original_constructor: 
        SchemaNamespace.GenericTypeConstructor<OriginalReturnType, OriginalInputShape> |
        SchemaNamespace.SchemaLike;
    _input_value: OriginalInputShape;

    constructor(
        input_value: unknown,
        original_constructor: 
            SchemaNamespace.GenericTypeConstructor<OriginalReturnType, OriginalInputShape> |
            SchemaNamespace.SchemaLike,
        default_value?: DefaultValue
    ) {
        super(input_value);
        this._default_value = default_value;
        this._input_value = input_value as OriginalInputShape;
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

    

    public async handler(): Promise<ExtractReturnType<DefaultValue, OriginalReturnType> | undefined> {
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


            // -- Validate the data
            try {
                const validated_data = await this._validate_data(this.value);
                return validated_data;
            }

            // -- Add a hint if it fails
            catch (unkown_error) {
                const error = GenericError.from_unknown(unkown_error);
                error.hint = 'Error occurred while validating the schema';
                error.data = { expected: this.constructor.name, value: this.value };
                throw error;
            }
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
    DefaultValue extends (
        OriginalReturnType extends SchemaNamespace.SchemaLike ? 
            SchemaNamespace.ReturnType<OriginalReturnType> : 
            OriginalReturnType
        ) | undefined, 
>(
    constructor: SchemaNamespace.GenericTypeConstructor<
        OriginalReturnType, 
        OriginalInputShape
    > | OriginalReturnType,
    default_value: DefaultValue = undefined as DefaultValue
) => (class extends OptionalTypeClass<
    OriginalReturnType extends SchemaNamespace.SchemaLike ? 
        SchemaNamespace.ReturnType<OriginalReturnType> : 
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