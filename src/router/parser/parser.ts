import {parse_validator} from "./validator";



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
> => new Promise(async(resolve, reject) => {

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
    if (error) return reject(error);
    return resolve(result);
});
