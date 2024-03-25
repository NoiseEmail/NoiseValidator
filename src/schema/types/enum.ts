import { GenericError } from '../../error';
import GenericType from '../generic';



const create_enum = <
    InputTypes extends string | number | boolean,
    InputArray extends Array<InputTypes>
>(
    ...input_types: InputArray
) => class OptionalClass extends GenericType<
    InputArray[number], Array<unknown>
> { 
    private readonly _input_types: InputArray = input_types;


    protected handler = (): InputTypes => {
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
}



export default create_enum;