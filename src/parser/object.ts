import { Binder, Paramaters } from '../binder/types';
import ParserError from './error';
import {validate} from './validate/validate';

// Note this function needs to get condemned to the shadow realm
// It's a mess and I don't want to deal with it right now

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
 *  Paramaters.ObjectParaseResult<Input>|
 *  Binder.ParserError
 * >} - Returns a promise that resolves to either a converted object or a parser error.
 */
export const parse_object = async<
    Input extends (
        Paramaters.WrappedBody |
        Paramaters.WrappedQuery
    )
>(
    validator: Input,
    input: object
): Promise<
    Paramaters.ObjectParaseResult<Input> |
    ParserError
> => new Promise(async(resolve, reject) => {

    let error: ParserError | null = null;
    const walk = async(
        validator_obj: Paramaters.WrappedBody | Paramaters.WrappedQuery,
        input_obj: Object,
        built_obj: Object,
        path: Array<string> = [],
        map: Map<string, Array<{
            path: Array<string>;
            value: unknown;
            type: 'Binder' | 'Middleware'
        }>> = new Map() 
    ): Promise<
        Paramaters.ObjectParaseResult<Input> |
        ParserError
    > => {

        // -- Iterate over the keys of the validator object
        for (const key in validator_obj) {


            // -- If the key is not a property of the object, skip it
            if (!Object.prototype.hasOwnProperty.call(validator_obj, key)) continue;
            const value: any = validator_obj[key] as any;


            // -- If the value is an object, we need to walk it
            if (
                Object.is(value, Object(value)) &&
                !Array.isArray(value)
            ) {
                const result = await walk(value, input_obj[key], {}, [...path, key], map);
                if (result) built_obj[key] = result;
            }


            if (Array.isArray(value)) {
                const custom_validators: Array<Paramaters.CustomValidatorWrapper> = value;
                
                for (let i = 0; i < custom_validators.length; i++) {
                    const custom_validator = custom_validators[i];
                    let result: Paramaters.Parsed;

                    try { result = await validate(
                        custom_validator.function, 
                        input_obj[key]
                    ); }

                    catch (e) { result = { 
                        type: 'custom', 
                        optional: false, 
                        valid: false, 
                        value: null 
                    }; }

                    if (result.valid) {
                        if (!map.has(custom_validator.belongs_to)) 
                            map.set(custom_validator.belongs_to, []);

                        map.get(custom_validator.belongs_to)?.push({
                            path: custom_validator.path,
                            value: result.value, 
                            type: custom_validator.type
                        });
                    }

                    else {
                        // -- Set the error
                        error = new ParserError(
                            [...path, key], 'Invalid parameter',
                            'string', result.value, result
                        );

                        // -- And quit the function
                        return error;
                    }
                }
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
        return {
            parsed_object: built_obj as Binder.ConvertObjectToType<Input>,
            custom_validators: map
        };
    }


    // -- Validate the object
    const result = await walk(validator, input, {});
    if (error) return reject(error);
    return resolve(result);
});
