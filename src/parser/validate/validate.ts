import { Paramaters } from '../../binder/types';
import {base_validator} from './base';
import {function_validator} from './function';



/**
 * @name validate
 * Validates the input based on the provided validator.
 *
 * @param {Paramaters.All} validator - The validator to use.
 * @param {any} input - The input to validate.
 *
 * @returns {Promise<Paramaters.Parsed>} - Returns a promise that resolves to a parsed parameter object.
 */
export const validate = (
    validator: Paramaters.All,
    input: any
): Promise<Paramaters.Parsed> => new Promise(async(resolve) => {
    switch (typeof validator) {
        case 'string':
            const is_optional = validator.startsWith('Optional<'),
                type = is_optional ? validator.slice(9, -1) : validator;
            return resolve(base_validator(type as Paramaters.Primative, is_optional, input));

        case 'function': return await function_validator(validator, input).then(resolve);
    }
});
