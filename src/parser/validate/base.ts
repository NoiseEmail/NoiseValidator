import { Paramaters } from '../../binder/types';
import Log from '../../logger/log';


/**
 * @name base_validator
 * Validates the base parameter types (string, number, boolean)
 * and returns a parsed parameter object.
 *
 * @param {Paramaters.Primative} base_parameter - The base parameter type to validate.
 * @param {boolean} is_optional - Whether the parameter is optional.
 * @param {any} input - The input to validate.
 *
 * @returns {Paramaters.Parsed} - Returns a parsed parameter object.
 */
export const base_validator = (
    base_parameter: Paramaters.Primative,
    is_optional: boolean,
    input: any
): Paramaters.Parsed => {

    // -- If the input is empty and the parameter
    //    is optional, return a valid object
    if ((
        input === null ||
        input === undefined ||
        input === ''
    ) && is_optional) return {
        type: base_parameter,
        optional: is_optional,
        valid: true,
        value: null
    };


    // -- Create the returnable object
    const returnable = {
        type: base_parameter,
        optional: is_optional,
        valid: false,
        value: input
    };


    // -- Validate the input
    switch (base_parameter) {
        case 'string':
            returnable.valid = typeof input === 'string';
            break;

        case 'number':
            
            try {
                input = input.toString();
                returnable.value = Number(input);
                returnable.valid = !isNaN(returnable.value);
            } 
            
            catch (e) {
                returnable.valid = false;
                returnable.value = null;
            }

            if (!returnable.valid) 
                returnable.value = null;

            break;

        case 'boolean':
            try { input = input.toString(); }
            catch (e) { returnable.valid = false; break; }

            const input_string = input.toLowerCase().trim();
            returnable.valid = input_string === 'true' || input_string === 'false';
            returnable.value = returnable.valid ? input_string === 'true' : null;
            break;

        default:
            Log.error(`[PARSER] [BASE_VALIDATOR] Invalid base parameter: ${base_parameter}`);
            break;
    }


    return returnable;
};