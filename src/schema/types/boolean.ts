import GenericType from '../generic';
import { Schema } from '../types.d';

export default class Boolean extends GenericType<boolean, boolean> {
    protected strict: boolean = false;

    protected handler = () => {
            
        if (typeof this.value === 'boolean') return this.value;

        if (typeof this.value === 'string') {
            if (this.value.toLowerCase() === 'true') return true;
            if (this.value.toLowerCase() === 'false') return false;
        }

        return this.invalid('Invalid boolean');
    }


   


    public static config = <
        ReturnType extends boolean,
        InputShape extends boolean
    >(configuration: {
        strict?: boolean
    }): GenericType<ReturnType, InputShape>['constructor'] => class extends Boolean {
        protected strict: boolean = configuration.strict || false;
    } 



    public static get name() {
        return 'Boolean';
    }
}