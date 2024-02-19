import Log from "../logger/log";
import Parameter = RouterTypes.Binder.Parameter;



/**
 * @name validate_object
 * @async
 *
 * Validates user input against a given validation object.
 *
 * @param {Input} validator - The validation object. This should be either a `RouterTypes.Binder.RequiredBody` or `RouterTypes.Binder.RequiredQuery`.
 * @param {object} input - The input to validate.
 *
 * @returns {Promise<
 *  RouterTypes.Binder.ConvertObjectToType<Input> |
 *  RouterTypes.Binder.ParserError
 * >} - Returns a promise that resolves to either a converted object or a parser error.
 */
export const validate_object = async<
    Input extends (
        RouterTypes.Binder.RequiredBody |
        RouterTypes.Binder.RequiredQuery
    )
>(
    validator: Input,
    input: object
): Promise<
    RouterTypes.Binder.ConvertObjectToType<Input> |
    RouterTypes.Binder.ParserError
> => {

    let error: RouterTypes.Binder.ParserError | null = null;


    const walk = async(
        validator_obj:
            RouterTypes.Binder.RequiredBody |
            RouterTypes.Binder.RequiredQuery,
        input_obj: object,
        built_obj: Object,
        path: Array<String> = []
    ): Promise<
        RouterTypes.Binder.ConvertObjectToType<Input> |
        RouterTypes.Binder.ParserError
    > => {

        // -- Iterate over the keys of the validator object
        for (const key in validator_obj) {


            // -- If the key is not a property of the object, skip it
            if (!Object.prototype.hasOwnProperty.call(validator_obj, key)) continue;
            const value = validator_obj[key];


            // -- If the value is an object, we need to walk it
            if (typeof value === 'object') {
                const result = await walk(value, input_obj[key], {}, [...path, key]);
                if (result) built_obj[key] = result;
            }


            // -- If the value is a string, we need to validate it
            else if (
                typeof value === 'string' ||
                typeof value === 'function'
            ) {
                // -- Validate the parameter
                const result = await parse_validator(value, input_obj[key]);
                if (result.valid) built_obj[key] = result.value;

                else {
                    // -- Set the error
                    error = { message: 'Invalid parameter',  parameter: value,
                        input: input_obj[key],  details: result, path: [...path, key] };

                    // -- And quit the function
                    return error;
                }
            }
        }

        // -- Return the built object
        return built_obj as RouterTypes.Binder.ConvertObjectToType<Input>;
    }


    // -- Validate the object
    const result = await walk(validator, input, {});
    if (error) return error;
    return result;
};



export const parse_validator = (
    validator: Parameter,
    input: any
): Promise<RouterTypes.Binder.ParserParameterDetailed> => new Promise(async(resolve) => {
    switch (typeof validator) {
        case 'string':
            const is_optional = validator.startsWith('Optional<'),
                type = is_optional ? validator.slice(9, -1) : validator;
            return resolve(base_validator(type as RouterTypes.Binder.BaseParameter, is_optional, input));


        case 'function':

            const rejection = (reason: string | Error | null | undefined) => {
                Log.error(`[PARSER] [CUSTOM_VALIDATOR] ${reason}`);
                resolve({ type: 'custom', optional: false, valid: false, value: input });
            };

            try {
                const result = await validator(input, rejection);
                return resolve({
                    type: 'custom',
                    optional: false,
                    valid: true,
                    value: result
                });
            }

            catch (e) { return resolve({
                type: 'custom',
                optional: false,
                valid: false,
                value: input
            })}
    }
});



export const base_validator = (
    base_parameter: RouterTypes.Binder.BaseParameter,
    is_optional: boolean,
    input: any
): RouterTypes.Binder.ParserParameterDetailed => {

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
                returnable.valid = true;
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