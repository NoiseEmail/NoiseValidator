import Log from "../../logger/log";
import {RouterTypes} from "../types";



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