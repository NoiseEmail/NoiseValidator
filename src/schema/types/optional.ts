import { GenericError } from '../../error';
import GenericType from '../generic';
import { Schema } from '../types.d';



const Optional = <
    Constructor extends Schema.GenericTypeConstructor<any>,
    ReturnType = Schema.ExtractParamaterReturnType<Constructor>,
    InputShape = Schema.ExtractParamaterInputShape<Constructor>
>(
    constructor: Constructor
) => class OptionalClass extends GenericType<
    ReturnType | undefined | void, InputShape | undefined | Partial<InputShape>
> {
    constructor(
        input_value: unknown,
        on_invalid: (error: GenericError) => void,
        on_valid: (result: ReturnType | undefined | void) => void,
    ) {
        super(input_value, on_invalid, on_valid);
    }

    protected handler = async (): Promise<ReturnType | undefined | void> => {
        if (this.value === undefined) return undefined;

        return new Promise<ReturnType | undefined>((resolve, reject) => {
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

            instance.execute().then(() => resolve(undefined));
        });
    }

    public static get name() {
        return `Optional<${constructor.name}>`;
    }
}



/**
 * @description This is a wrapper for any generic type that makes it optional
 * it will return undefined if the input value is undefined.
 * 
 * If the input value is not undefined, it will execute the constructor, if 
 * that constructor returns a valid value, it will return that value.
 * 
 * If the value is not undefined, and the constructor returns an invalid value,
 * it will return an error like any other generic type.
 * 
 * @param {GenericTypeConstructor} constructor - The constructor to wrap
 * 
 * @returns {OptionalClass} A class that wraps the constructor
 */
const create_optional: <T>(
    constructor: Schema.GenericTypeConstructor<T>
) => new (
    input_value: unknown,
    on_invalid: (error: GenericError) => void,
    on_valid: (result: T | undefined | void | null) => void,
) => GenericType<T | undefined | void | null> = Optional;



export default create_optional;