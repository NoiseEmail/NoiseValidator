import { ArrayModifier, BinderNamespace, SchemaOutput } from 'noise_validator/src/binder/types';
import { SchemaNamespace } from 'noise_validator/src/schema/types';
import { HTTPMethods } from 'fastify';
import { BinderInputObject, GenericAPIDataParamaters, ExecutedAPIResponse, APIRequestObject, InterceptAfterCallback, InterceptBeforeCallback } from './types.d';
import { GenericError } from 'noise_validator/src/error';



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

    BinderCallbackReturn    extends SchemaOutput.Types<BodyOutputSchema, HeadersOutputSchema> & ExecutedAPIResponse,
>(  
    api_root: string,
    route: DynamicURLInputSchema,
    method: HTTPMethods,
    configuration: BinderNamespace.OptionalConfiguration<any, BodyInputSchema, QueryInputSchema, HeadersInputSchema, CookieInputSchema, BodyOutputSchema, HeadersOutputSchema>['schemas'] & 
        { intercept_after?: InterceptAfterCallback, intercept_before?: InterceptBeforeCallback }
): ((input: BinderInputObject<BodyInputSchema, QueryInputSchema, HeadersInputSchema, CookieInputSchema, DynamicURLInputSchema>) => Promise<BinderCallbackReturn>) => {
    const clean_path = clean_url(route);
    const clean_root = api_root.endsWith('/') ? api_root.slice(0, -1) : api_root;
    return async (raw_input: BinderInputObject<BodyInputSchema, QueryInputSchema, HeadersInputSchema, CookieInputSchema, DynamicURLInputSchema>): Promise<BinderCallbackReturn> => {
        
        // -- Prepare the input data
        const empty_input = { body: {}, query: {}, headers: {}, route: {}, cookies: {} };
        let input = { ...empty_input, ...raw_input }

        try { if (configuration.intercept_before) {
            const response = await configuration.intercept_before(input);
            // @ts-ignore
            if (response !== null && response !== undefined) input = response;
        }}
        catch (error) { console.log('ERROR: intercept_before function', error) }


        // -- Execute the API route
        let api_response = await execute_api_route(clean_root + '/' + clean_path, method, {
            body: input.body,
            query: input.query,
            headers: input.headers,
            route: input.route,
            cookies: input.cookies
        });
        

        try { if (configuration.intercept_after) {
            const response = await configuration.intercept_after(api_response);
            if (response !== null && response !== undefined) api_response = response;
        }}
        catch (error) { console.log('ERROR: intercept_after function', error) }

        // -- Return the output data
        return (api_response as { [key: string]: unknown }) as BinderCallbackReturn;
    };
};




const execute_api_route = async (
    route: string,
    method: HTTPMethods,
    data: GenericAPIDataParamaters
): Promise<ExecutedAPIResponse> => {
    const request_object: APIRequestObject = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Cookie': build_cookie_string(data.cookies),
            ...(data.headers || {})
        },
    };

    // -- Build the request URL
    const request_url: string = replace_route_parameters(route, data.route);
    const query_string = build_query_string(data.query, request_url);

    // -- Check if we can set the body
    if (data.body !== undefined && method !== 'GET') {
        request_object.headers['Content-Type'] = 'application/json';
        request_object.body = JSON.stringify(data.body);;
    }

    // -- Send the request
    try {
        const api_request = new Request(query_string, request_object); 

        // -- Handle the response
        const response = await fetch(api_request);
        if (!response.ok) throw response;
        const response_data = await response.json();

        // -- Convert the headers to an object
        const headers: { [x: string]: string } = {};
        response.headers.forEach((value, key) => headers[key] = value);
        
        return { body: response_data, headers: headers, success: true, status: response.status, raw: response };
    }
    

    
    // -- Easier to handle errors like this, due to the 'success' key
    //    as Now you wont have to do a 'instanceof' check etc.
    catch (unknown_error) {
        const error = await handle_error(unknown_error);
        return { error, success: false, status: error.code };
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
    if (unknown_error instanceof Response) 
    try { return GenericError.deserialize(await unknown_error.json()); }
    catch (error) {
        return GenericError.from_unknown(
            error,
            new GenericError('Failed to create request', 500),
            'handle_error: ' + unknown_error.statusText
        )
    }

    // -- Handle unknown errors
    else return GenericError.from_unknown(
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
    for (const [key, value] of Object.entries(parameters)) new_route = new_route.replace(`:${key}`, String(value));
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
    url = url.replace(/\/\//g, '/');
    if (url.endsWith('/')) url = url.slice(0, -1);
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