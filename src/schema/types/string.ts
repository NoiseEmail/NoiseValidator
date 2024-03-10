import GenericType from '../generic_type';

export default class String extends GenericType<string> {

    /**
     * Basically anything is a string
     * so try covert it to a string, if
     * it fails, it's invalid
     */
    protected handler = () => {

        try {
            if (typeof this.value === 'string') return this.value;

            // @ts-ignore
            return this.value.toString();
        }
        
        catch {
            return this.invalid('Invalid string');
        }
    }
}