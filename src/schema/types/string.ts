import GenericType from '../generic';
import { GenericError } from '@error';



export default class String extends GenericType<string, string> {

    protected max_length: number | undefined;
    protected min_length: number | undefined;
    protected regex: RegExp | undefined;



    protected validate = (
        value: string
    ) => {
        if (this.max_length !== undefined && value.length > this.max_length) 
            throw new Error('Invalid string, too long');

        if (this.min_length !== undefined && value.length < this.min_length) 
            throw new Error('Invalid string, too short');

        if (this.regex !== undefined && !this.regex.test(value)) 
            throw new Error('Invalid string, does not match regex');

        return value;
    };




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
                return this.validate(this.value);

            // -- Check if the value contains a 'toString' method
            if (typeof this?.value?.toString === 'function') {
                const string = this.value.toString();
                if (typeof string === 'string') 
                    return this.validate(string);
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
    };



    public static config = (configuration: {
        max_length?: number,
        min_length?: number,
        regex?: RegExp
    }): typeof GenericType<string, string> => (class extends String {
        protected max_length = configuration.max_length;
        protected min_length = configuration.min_length;
        protected regex = configuration.regex;
    })


    
    public static get name() {
        return 'String';
    }
}