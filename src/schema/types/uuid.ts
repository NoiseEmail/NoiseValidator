import GenericType from '../generic';
import { GenericError } from '@error';
import { v1 as uuidv1, v4 as uuidv4, validate, version } from 'uuid';



export default class Uuid extends GenericType<string, string> {
    protected create_new_if_invalid = false;
    protected version = 4;

    protected handler = () => {
        this.log.debug('Handling UUID');        

        try {
            // -- If the value is not provided, return undefined
            if (
                this.value === undefined ||
                this.value === null ||
                this.value === void 0
            ) throw new Error('Value not provided');


            // -- Make sure that the input is a valid string 
            if (typeof this.value !== 'string') 
                throw new Error('Invalid UUID, not a string');


            // -- If the input is a valid UUID, return it
            if (!validate(this.value)) 
                throw new Error('Invalid UUID, not a valid UUID');


            // -- Check if the UUID is the correct version
            if (version(this.value) !== this.version)
                throw new Error('Invalid UUID version');


            // -- Return the UUID
            return this.value;
        }
        
        catch (unknown_error) {
            // -- Check if we should create a new UUID if the input is invalid
            if (this.create_new_if_invalid) {
                this.log.debug('Creating a new UUID');
                switch (this.version) {
                    case 1: return uuidv1();
                    case 4: return uuidv4();
                }
            }

            // -- Create an error and return it
            return this.invalid(GenericError.from_unknown(
                unknown_error, 
                new GenericError('Unknown error occurred in UUID handler', 500)
            ));
        }
    }



    public static config = (configuration: {
        create_new_if_invalid?: boolean,
        version?: 1 | 4
    }): typeof GenericType<string, string> => (class extends Uuid {
        protected create_new_if_invalid = configuration.create_new_if_invalid ?? false;
        protected version = configuration.version ?? 4;
    })


    
    public static get name() {
        return 'UUID';
    }
}