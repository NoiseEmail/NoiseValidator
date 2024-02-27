import Log from "../../logger/log";
import {RouterTypes} from "../../router/types";



/**
 * @name function_validator
 * Validates the base parameter types (string, number, boolean)
 * and returns a parsed parameter object.
 *
 * @param {RouterTypes.Paramaters.Parsed} validator - The base parameter type to validate.
 * @param {any} input - The input to validate.
 *
 * @returns {RouterTypes.Paramaters.Parsed} - Returns a parsed parameter object.
 */
export const function_validator = async (
    validator: RouterTypes.Paramaters.All,
    input: any
): Promise<RouterTypes.Paramaters.Parsed> => {


    // -- Has to be a function
    if (typeof validator !== 'function') {
        Log.error(`[PARSER] [FUNCTION_VALIDATOR] The validator is not a function.`);
        return { type: 'custom', optional: false, valid: false, value: input };
    }


    let error: RouterTypes.Paramaters.Parsed | null = null;
    const rejection = (reason: string | Error | null | undefined) => {
        error = { type: 'custom', optional: false, valid: false, value: input };
    };


    try {
        const result = await validator(input, rejection);
        if (error) return error;
        return { type: 'custom', optional: false, valid: true, value: result };
    } catch (e) {
        return { type: 'custom', optional: false, valid: false, value: input };
    }
}