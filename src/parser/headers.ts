import { Paramaters } from '../binder/types';
import ParserError from './error';

export const headers = (
    headers: any,
    headers_schema: Paramaters.Headers
): ParserError | null => {

    for (const [key, value] of Object.entries(headers_schema)) {

        // -- Check if the header is present
        const exists = Object.prototype.hasOwnProperty.call(headers, key);
        if (!exists && value === true) return new ParserError(
            ['headers', key], 'Header is missing', key, null,
            { type: 'string', optional: false, valid: false, value: null }
        );

    }

    return null;
}