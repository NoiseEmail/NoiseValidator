import { GenericError } from '../../error';
import GenericType from '../generic';

export default class String extends GenericType<string, string> {

    /**
     * Basically anything is a string
     * so try covert it to a string, if
     * it fails, it's invalid
     */
    protected handler = () => {

        try {   

            // -- If the value is not provided, return undefined
            if (
                this.value === undefined ||
                this.value === null ||
                this.value === void 0
            ) throw new Error('Value not provided');


            // -- If the value is a string, return it
            if (typeof this.value === 'string') 
                return this.value;

            // -- Check if the value contains a 'toString' method
            if (typeof this?.value?.toString === 'function') {
                const string = this.value.toString();
                if (typeof string === 'string') return string;
            }

            // -- Throw an error if the value is not a string
            throw new Error('Invalid string');
        }
        
        catch (unknown_error) {
            return this.invalid(GenericError.from_unknown(
                unknown_error, 
                new GenericError('Unknown error occurred parsing string', 500)
            ));
        }
    }


    
    public static get name() {
        return 'String';
    }
}