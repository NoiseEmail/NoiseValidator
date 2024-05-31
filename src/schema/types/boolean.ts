import GenericType from '../generic';
import { GenericError } from '@error';



export default class Boolean extends GenericType<boolean, boolean> {

    protected handler = async (): Promise<boolean> => {
        // -- If the value is not provided, return undefined
        if (
            this.value === undefined ||
            this.value === null ||
            this.value === void 0
        ) throw new Error('Value not provided');

        // -- Cleanup the value and check if it is a boolean
        const value = this.value.toString().toLowerCase().trim();
        if (value === 'true' || value === 'false')
            return (value === 'true') ;
        
        // -- If the value is not a boolean, throw an error
        throw new Error('Invalid boolean');
    }



    public static get name() {
        return 'Boolean';
    }
}