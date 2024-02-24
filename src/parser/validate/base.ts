import Log from "../../logger/log";
import {RouterTypes} from "../../router/types";



/**
 * @name base_validator
 * Validates the base parameter types (string, number, boolean)
 * and returns a parsed parameter object.
 *
 * @param {RouterTypes.Binder.BaseParameter} base_parameter - The base parameter type to validate.
 * @param {boolean} is_optional - Whether the parameter is optional.
 * @param {any} input - The input to validate.
 *
 * @returns {RouterTypes.Binder.ParsedParameter} - Returns a parsed parameter object.
 */
export const base_validator = (
    base_parameter: RouterTypes.Binder.BaseParameter,
    is_optional: boolean,
    input: any
): RouterTypes.Binder.ParsedParameter => {

    // -- If the input is empty and the parameter
    //    is optional, return a valid object
    if (!input && is_optional) return {
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
                returnable.value = Number(input);
                returnable.valid = !isNaN(returnable.value);
            } catch (e) {
                returnable.valid = false;
                returnable.value = null;
            }
            break;

        case 'boolean':
            const input_string = input.toString().toLowerCase();
            returnable.valid = input_string === 'true' || input_string === 'false';
            returnable.value = returnable.valid ? input_string === 'true' : null;
            break;

        default:
            Log.error(`[PARSER] [BASE_VALIDATOR] Invalid base parameter: ${base_parameter}`);
            break;
    }


    return returnable;
};