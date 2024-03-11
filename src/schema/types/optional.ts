import GenericType from '../generic_type';
import { Schema } from '../types';


export default <Constructor extends Schema.GenericTypeConstructor<any>>(
    constructor: Constructor
) => class Optional extends GenericType<
    Schema.Returnable<InstanceType<Constructor>> | undefined
> {
    protected handler = async () => {
        if (this.value === undefined) return undefined;
        const instance = new constructor(this.value, this.invalid, this.valid);
        await instance.execute();
        return instance.validated;
    };

    public static get name() {
        return `Optional<${constructor.name}>`;
    }
}