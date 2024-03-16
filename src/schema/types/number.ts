import GenericType from '../generic';

export default class Number extends GenericType<number, number> {

    /**
     * The input could be a string or a number
     * so we need to check for both
     */
    protected handler = () => {

        // -- If it's a string, we need to parse it
        if (typeof this.value === 'string') {
            const parsed = parseFloat(this.value);
            if (isNaN(parsed)) return this.invalid('Invalid number');
            return parsed;
        }

        // -- If it's a number, we're good
        else if (typeof this.value === 'number') return this.value;

        // -- If it's not a number, it's invalid
        else return this.invalid('Invalid number');
    }



    public static get name() {
        return 'GenericNumber';
    }
}