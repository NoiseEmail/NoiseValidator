import { GenericError } from '../../error/generic';
import GenericType from '../generic';
import { Schema } from '../types';


export default <
    Constructor extends Schema.GenericTypeConstructor<any>,
    OrigianlType extends Schema.ExtractParamaterReturnType<Constructor>
>(
    constructor: Constructor
) => class Optional extends GenericType<
    OrigianlType | undefined
> {
    protected handler = async () => new Promise<OrigianlType | undefined>(
        async(resolve, reject) => 
    {
        if (this.value === undefined) return resolve(undefined);

        const instance = new constructor(this.value, 
            (error) => {
                this.invalid(error);
                reject(error);
            }, 
            (value) => {
                this.valid(value);
                resolve(value);
            }
        );

        await instance.execute();
    });
    
    public static get name() {
        return `Optional<${constructor.name}>`;
    }
}