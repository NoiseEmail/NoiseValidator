import { GenericError } from '../../error';
import GenericType from '../generic';
import { Schema } from '../types.d';


const create_enum = <
    InputTypes extends Array<string | number | boolean>,
    ReturnType = InputTypes[number]
>(
    ...input_types: InputTypes
) => class OptionalClass extends GenericType<
    ReturnType, unknown
> { 
    private readonly _input_types: InputTypes = input_types;


    protected handler = (): ReturnType => {
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
        if (!this._input_types.includes(this.value))
            throw new GenericError('Value not in enum', 400);

        // -- Return the value
        return this.value as ReturnType;
    }
}


export default create_enum;