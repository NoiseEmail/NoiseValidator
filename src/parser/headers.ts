import {RouterTypes} from "../router/types";
import ParserError from "./error";

export const headers = (
    headers: any,
    required_headers: RouterTypes.Binder.RequiredHeaders
): ParserError | null => {

    for (const [key, value] of Object.entries(required_headers)) {

        // -- Check if the header is present
        const exists = Object.prototype.hasOwnProperty.call(headers, key);
        if (!exists) return new ParserError(
            ['headers', key], 'Header is missing', key, null,
            { type: 'string', optional: false, valid: false, value: null }
        );

    }

    return null;
}