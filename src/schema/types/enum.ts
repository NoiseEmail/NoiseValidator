import GenericType from '../generic';
import { GenericError } from 'noise_validator/src/error';



class EnumTypeClass<
    InputTypes extends string | number | boolean,
    InputArray extends Array<InputTypes>
> extends GenericType<
    InputArray[number], Array<unknown>
> { 
    _input_types: InputArray;
    _input_value: unknown;


    constructor(
        input_value: unknown,
        input_types: InputArray
    ) {
        super(input_value);
        this._input_types = input_types;
        this._input_value = input_value;
    }


    public async handler(): Promise<InputTypes> {
        // -- No value was provided
        if (
            this.value === undefined ||
            this.value === null ||
            this.value === void 0
        ) throw new GenericError('Value not provided', 400);
        
        // -- If the value is not a string or number, throw an error
        if (
            typeof this.value !== 'string' && 
            typeof this.value !== 'number' &&
            typeof this.value !== 'boolean'
        ) throw new GenericError('Invalid enum value type', 400);

        // -- Check if the value is in the input types
        if (!this._input_types.includes(this.value as InputTypes))
            throw new GenericError('Value not in enum', 400);

        // -- Return the value
        return this.value as InputTypes;
    }
};



const create_enum = <
    InputTypes extends string | number | boolean,
    InputArray extends Array<InputTypes>
>(
    ...input_types: InputArray
) => (class extends EnumTypeClass<InputTypes, InputArray> {
    constructor(input_value: unknown) {
        super(input_value, input_types);
    }
});



export default create_enum;