import { GenericError } from '../../error';
import GenericType from '../generic';

export default class Boolean extends GenericType<boolean, boolean> {

    protected handler = () => {

        try {
            // -- If the value is not provided, return undefined
            if (
                this.value === undefined ||
                this.value === null ||
                this.value === void 0
            ) throw new Error('Value not provided');

            // -- Cleanup the value and check if it is a boolean
            const value = this.value.toString().toLowerCase().trim();
            if (value === 'true' || value === 'false')
                return value === 'true';
            
            // -- If the value is not a boolean, throw an error
            throw new Error('Invalid boolean');
        }

        catch (unknown_error) {
            return this.invalid(GenericError.from_unknown(
                unknown_error, 
                new GenericError('Unknown error occurred parsing boolean', 500)
            ));
        }
    }



    public static get name() {
        return 'Boolean';
    }
}