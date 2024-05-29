import { ArrayModifier, BinderNamespace, SchemaOutput, Schemas } from '@binder/types';
import { SchemaNamespace } from '@schema/types';
import { HTTPMethods } from 'fastify';
import { BinderInputObject } from './types';
import { GenericError } from '@error';



/**
 * @description Registers an API route by creating a handler function that handles
 * input and out validation, error handling, and the actual logic of the route.
 * 
 * @param {string} route The URL path of the API route.
 * @param {'GET' | 'POST' | 'PUT' | 'DELETE'} method The HTTP method of the API route.
 * @param {OptionalBinderConfiguration} configuration The configuration object that contains the schemas for the input and output data.
 * 
 * @throws {GenericError} If the request fails.
 * 
 * @returns {Promise<OutputObject>} The output data of the API route or a generic error object.
 */
const register_api_route = <
    // -- Input types
    DynamicURLInputSchema   extends string,
    BodyInputSchema         extends ArrayModifier.ArrayOrSingle<SchemaNamespace.NestedSchemaLike>,
    QueryInputSchema        extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
    HeadersInputSchema      extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
    CookieInputSchema       extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,

    // -- Output types
    BodyOutputSchema        extends ArrayModifier.ArrayOrSingle<SchemaNamespace.NestedSchemaLike>,
    HeadersOutputSchema     extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,

    BinderCallbackReturn    extends SchemaOutput.Types<BodyOutputSchema, HeadersOutputSchema>,
>(  
    api_root: string,
    route: DynamicURLInputSchema,
    method: HTTPMethods,
    configuration: BinderNamespace.OptionalConfiguration<any, BodyInputSchema, QueryInputSchema, HeadersInputSchema, CookieInputSchema, BodyOutputSchema, HeadersOutputSchema>['schemas']
): ((input: BinderInputObject<BodyInputSchema, QueryInputSchema, HeadersInputSchema, CookieInputSchema, DynamicURLInputSchema>) => Promise<BinderCallbackReturn>) => {
    const clean_path = clean_url(route);
    const clean_root = api_root.endsWith('/') ? api_root.slice(0, -1) : api_root;
    return async (raw_input: BinderInputObject<BodyInputSchema, QueryInputSchema, HeadersInputSchema, CookieInputSchema, DynamicURLInputSchema>): Promise<BinderCallbackReturn> => {
        
        // -- Prepare the input data
        const empty_input = { body: {}, query: {}, headers: {}, route: {}, cookies: {} };
        const input = { ...empty_input, ...raw_input }

        // -- Execute the API route
        const api_response = await execute_api_route(clean_root + '/' + clean_path, method, {
            body: input.body,
            query: input.query,
            headers: input.headers,
            route: input.route,
            cookies: input.cookies
        });

        // -- Return the output data
        return (api_response as { [key: string]: unknown }) as BinderCallbackReturn;
    };
};




const execute_api_route = async (
    route: string,
    method: HTTPMethods,
    data: {
        body: { [x: string]: unknown },
        query: { [x: string]: unknown },
        headers: { [x: string]: unknown },
        route: { [x: string]: unknown },
        cookies: { [x: string]: unknown }
    }
): Promise<{
    body: { [x: string]: unknown },
    headers: { [x: string]: unknown },
}> => {
    try {
        // -- Serialize the request body
        let request_body;
        if (data.body !== undefined) 
            request_body = JSON.stringify(data.body);
        
        // -- Prepare the request URL
        let request_url: string = route;
        if (data.route !== undefined) request_url = replace_route_parameters(route, data.route);

        // -- Prepare the query string
        const query_string = build_query_string(data.query, request_url);

        // -- Build the API route
        const api_request = new Request(route, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(data.headers || {}),
                'Cookie': build_cookie_string(data.cookies),
            },
            body: request_body,
        }); 

        // -- Handle the response
        const response = await fetch(api_request);
        if (!response.ok) throw response;
        const response_data = await response.json();

        // -- Convert the headers to an object
        const headers: { [x: string]: string } = {};
        response.headers.forEach((value, key) => headers[key] = value);

        // -- Log headers
        return {
            body: response_data,
            headers: headers
        };
    }

    catch (unknown_error) {
        const error = await handle_error(unknown_error);
        throw error;
    }
};



const build_cookie_string = (cookies: { [x: string]: unknown }): string => {
    let cookie_string = '';
    for (const [key, value] of Object.entries(cookies)) cookie_string += `${key}=${value}; `;
    return cookie_string;
};



const handle_error = async (
    unknown_error: unknown,
): Promise<GenericError> => {

    // -- Handle known errors
    if (unknown_error instanceof Response) {

        // -- Try deserializing the error
        try { 
            const error_data = await unknown_error.json();
            const error = new GenericError(
                error_data.error.message, 
                unknown_error.status
            );

            error.data = error_data.error;
            return error;
        }

        catch (error) {
            return new GenericError(
                `Failed to create request: ${unknown_error.statusText}`, 
                unknown_error.status
            );
        }
    }


    // -- Handle unknown errors
    return GenericError.from_unknown(
        unknown_error, 
        new GenericError('Failed to create request', 500)
    );
};



const replace_route_parameters = (
    route: string,
    parameters: { [x: string]: unknown }
): string => {
    if (parameters === undefined) throw new GenericError('Parameters are undefined', 500);
    let new_route = route;
    for (const [key, value] of Object.entries(parameters)) new_route = new_route.replace(`:${key}`, '/' + String(value));
    return new_route;
};



const build_query_string = (
    query: { [x: string]: unknown },
    request_url: string
): string => {
    if (query === undefined) return '';
    let query_string = ``;

    for (let i = 0; i < Object.keys(query).length; i++) {
        if (i === 0) query_string += `?`;
        else query_string += `&`;

        const key = Object.keys(query)[i];
        const value = query[key];

        query_string += `${key}=${String(value)}`;
    }

    return `${request_url}${query_string}`;
};



const clean_url = (url: string): string => {
    
    // -- Remove double slashes
    url = url.replace(/\/\//g, '/');

    // -- Remove trailing slash 
    if (url.endsWith('/')) url = url.slice(0, -1);

    // -- Remove starting slash
    if (url.startsWith('/')) url = url.slice(1);

    return url;
};



export {
    register_api_route,
    execute_api_route,
    handle_error,
    replace_route_parameters,
    build_query_string,
    clean_url
};