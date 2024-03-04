import { Paramaters } from '../../binder/types';
import log from '../../logger/log';
import {base_validator} from './base';
import {function_validator} from './function';



export const is_optional = (validator: Paramaters.All): boolean => {
    if (typeof validator === 'string') return validator.startsWith('Optional<');
    return false;
};


export const extract_optional = (validator: Paramaters.All): Paramaters.All => {
    if (typeof validator === 'string') return validator.replace('Optional<', '').replace('>', '') as Paramaters.All;
    return validator;
};


export const extract_validator_details = (validator: Paramaters.All): {
    is_function: boolean,
    is_optional: boolean,
    type: Paramaters.Primative | 'custom'
} => {

    const raw_type = extract_optional(validator),
        optional = is_optional(validator);

    switch (raw_type) {
        case 'string': return { is_function: false, is_optional: optional, type: 'string' };
        case 'number': return { is_function: false, is_optional: optional, type: 'number' };
        case 'boolean': return { is_function: false, is_optional: optional, type: 'boolean' };
    }

    switch (typeof raw_type) {
        case 'string': return { is_function: false, is_optional: optional, type: 'string' };
        case 'number': return { is_function: false, is_optional: optional, type: 'number' };
        case 'boolean': return { is_function: false, is_optional: optional, type: 'boolean' };
    }

    return { 
        is_function: typeof validator === 'function',
        is_optional: false,
        type: 'custom'
    };
};


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
            const type = extract_optional(validator) as Paramaters.Primative;
            return resolve(base_validator(type, is_optional(validator), input));

        case 'function': return await function_validator(validator, input).then(resolve);
    }
});