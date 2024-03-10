import GenericType from '../generic_type';
import { Schema } from '../types';

export default class Boolean extends GenericType<boolean> {
    protected strict: boolean = false;

    protected handler = () => {
            
        if (typeof this.value === 'boolean') return this.value;

        if (typeof this.value === 'string') {
            if (this.value.toLowerCase() === 'true') return true;
            if (this.value.toLowerCase() === 'false') return false;
        }

        return this.invalid('Invalid boolean');
    }


   
    public static config = (strict: boolean): Schema.GenericTypeConstructor<any> => class extends Boolean {
        protected strict: boolean = strict;
    }
}