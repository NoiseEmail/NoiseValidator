import { Schema } from '../types.d';
import { GenericError } from '../../error';
import GenericType from '../generic';

export default class NumberType extends GenericType<number, number> {

    protected mode: 'integer' | 'float' | 'both' = 'both';


    /**
     * The input could be a string or a number
     * so we need to check for both
     */
    protected handler = () => {

        try {
            // -- If the value is not provided, return undefined
            if (
                this.value === undefined ||
                this.value === null ||
                this.value === void 0
            ) throw new Error('Value not provided');


            // -- Check if the value is equal to true or false
            const value = this.value.toString().toLowerCase().trim();
            if (value === 'true' || value === 'false')
                throw new Error('Value is a boolean, not a number');


            // -- Attempt to parse the value as a number
            let parsed;
            switch (this.mode) {
                case 'integer':
                    // -- Radix has to be 10, otherwise it will parse hex values
                    //    if the value starts with 0, eg 010 will be parsed as 8
                    parsed = parseInt(value, 10);
                    break;

                case 'both':
                case 'float':
                    parsed = parseFloat(value);
                    break;
            }

            if (isNaN(parsed)) throw new Error('Invalid number');
            
            // -- Parsed has to be under the maximum value of a number
            if (parsed > Number.MAX_SAFE_INTEGER) 
                throw new Error('Number exceeds maximum value');

            return parsed;
        }

        catch (unknown_error) {
            return this.invalid(GenericError.from_unknown(
                unknown_error, 
                new GenericError('Unknown error occurred parsing number', 500)
            ));
        }
    }


    public static config = (configuration: {
        mode: 'integer' | 'float' | 'both'
    }): typeof GenericType<number, number> => class extends NumberType {
        protected mode: 'integer' | 'float' | 'both' = configuration.mode || 'both';
    } 


    public static get name() {
        return 'Number';
    }
}