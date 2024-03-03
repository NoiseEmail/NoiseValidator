import { Binder, Paramaters } from '../binder/types';
import ParserError from './error';
import {validate} from './validate/validate';



/**
 * @name object
 * @async
 *
 * Validates user input against a given validation object.
 *
 * @param {Input} validator - The validation object. This should be either a `Paramaters.Body` or `Paramaters.Query`.
 * @param {object} input - The input to validate.
 *
 * @returns {Promise<
 *  Binder.ConvertObjectToType<Input> |
 *  Binder.ParserError
 * >} - Returns a promise that resolves to either a converted object or a parser error.
 */
export const object = async<
    Input extends (
        Paramaters.Body |
        Paramaters.Query
    )
>(
    validator: Input,
    input: object
): Promise<
    Binder.ConvertObjectToType<Input> |
    ParserError
> => new Promise(async(resolve, reject) => {

    let error: ParserError | null = null;


    const walk = async(
        validator_obj:
            Paramaters.Body |
            Paramaters.Query,
        input_obj: Object,
        built_obj: Object,
        path: Array<String> = []
    ): Promise<
        Binder.ConvertObjectToType<Input> |
        ParserError
    > => {

        // -- Iterate over the keys of the validator object
        for (const key in validator_obj) {


            // -- If the key is not a property of the object, skip it
            if (!Object.prototype.hasOwnProperty.call(validator_obj, key)) continue;
            const value: any = validator_obj[key] as any;


            // -- If the value is an object, we need to walk it
            if (typeof value === 'object') {
                const result = await walk(value, input_obj[key], {}, [...path, key]);
                if (result) built_obj[key] = result;
            }


            // -- If the value is a string, we need to validate it
            else if (
                typeof value === 'string' ||
                typeof value === 'function' ||
                value instanceof String ||
                value instanceof Number ||
                value instanceof Boolean
            ) {
                // -- Validate the parameter
                let result: Paramaters.Parsed;
                try { result = await validate(value, input_obj[key]); }
                catch (e) { result = { type: 'custom', optional: false, valid: false, value: null }; }
                if (result.valid) built_obj[key] = result.value;

                else {
                    // -- Set the error
                    error = new ParserError(
                        [...path, key], 'Invalid parameter',
                        value, result.value, result
                    );

                    // -- And quit the function
                    return error;
                }
            }
        }

        // -- Return the built object
        return built_obj as Binder.ConvertObjectToType<Input>;
    }


    // -- Validate the object
    const result = await walk(validator, input, {});
    if (error) return reject(error);
    return resolve(result);
});
