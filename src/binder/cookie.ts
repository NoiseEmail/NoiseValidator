import { CookieOptions, CookieShape } from "./types";
import Cookie from 'cookie';



const default_cookie_options: Partial<CookieOptions> = {
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
 * @param {Partial<CookieOptions>} options - The options for the cookie
 * 
 * @returns {CookieShape} - The cookie
 */
const cookie = (
    value: string, 
    options: Partial<CookieOptions> = {}
): CookieShape => {
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
 * @param {CookieShape} cookie - The cookie to serialize
 * 
 * @returns {string} - The serialized cookie
 */
const serialize_cookie = (
    name: string,
    cookie: CookieShape
): string => Cookie.serialize(name, cookie.value, {
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
 * @param {Map<string, CookieShape>} cookies - The cookies to serialize
 * 
 * @returns {string} - The `Set-Cookie` header
 */
const create_set_cookie_header = (
    cookies: Map<string, CookieShape>
): string => {
    const cookie_strings: string[] = [];
    cookies.forEach((cookie, name) => cookie_strings.push(serialize_cookie(name,cookie)));
    return cookie_strings.join('; ');
};



export {
    cookie,
    serialize_cookie,
    create_set_cookie_header
}