import Log from "../../logger/log";
import {base_validator} from "./base_validator";

export const parse_validator = (
    validator: RouterTypes.Binder.Parameter,
    input: any
): Promise<RouterTypes.Binder.ParsedParameter> => new Promise(async(resolve) => {
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
