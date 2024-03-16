import GenericType from '../generic';

export default class Uuid extends GenericType<string> {

    protected handler = () => {
        this.log.debug('Handling UUID');        

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