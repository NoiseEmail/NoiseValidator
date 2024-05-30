import CookieParser from 'cookie';
import { Cookie } from './types.d';



const default_cookie_options: Partial<Cookie.Options> = {
    domain: undefined,
    expires: undefined,
    http_only: false,
    max_age: undefined,
    path: '/',
    same_site: 'strict',
    secure: false,
    partitioned: false
};



/**
 * @name cookie
 * @description Creates a cookie object, this is just a helper function
 * you can create a cookie object manually if you want using the
 * `CookieShape` type.
 * 
 * @param {string} value - The value of the cookie, it will be url encoded
 * @param {Partial<Cookie.Options>} options - The options for the cookie
 * 
 * @returns {Cookie.Shape} - The cookie
 */
const cookie = (
    value: string, 
    options: Partial<Cookie.Options> = {}
): Cookie.Shape => {
    return {
        value,
        options: {
            ...default_cookie_options,
            ...options,
        }
    };
};



/**
 * @name serialize_cookie
 * @description Serializes a cookie object into a string
 * 
 * @param {string} name - The name of the cookie
 * @param {Cookie.Shape} cookie - The cookie to serialize
 * 
 * @returns {string} - The serialized cookie
 */
const serialize_cookie = (
    name: string,
    cookie: Cookie.Shape
): string => CookieParser.serialize(name, cookie.value, {
    domain: cookie.options.domain,
    expires: cookie.options.expires,
    httpOnly: cookie.options.http_only,
    maxAge: cookie.options.max_age,
    path: cookie.options.path,
    sameSite: cookie.options.same_site,
    secure: cookie.options.secure,
    partitioned: cookie.options.partitioned
});



/**
 * @name create_set_cookie_header
 * @description Creates the data for the `Set-Cookie` header
 * given an map of cookies
 * 
 * @param {Map<string, Cookie.Shape>} cookies - The cookies to serialize
 * 
 * @returns {string} - The `Set-Cookie` header
 */
const create_set_cookie_header = (
    cookies: Map<string, Cookie.Shape>
): string => {
    const cookie_strings: string[] = [];
    cookies.forEach((cookie, name) => cookie_strings.push(serialize_cookie(name,cookie)));
    return cookie_strings.join('; ');
};



export {
    cookie,
    serialize_cookie,
    create_set_cookie_header,
    default_cookie_options
};