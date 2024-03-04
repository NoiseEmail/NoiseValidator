import { HTTPMethods } from 'fastify';
import RouterError from './error';
import { Binder, Paramaters } from '../binder/types';

declare namespace Router {
    type Configuration<path extends string> = {
        path: path;
        friendly_name: String;
    }

    type BinderMap = Map<HTTPMethods, Array<Binder.Generic>>

    interface RouteCompatibleObject {
        body: Paramaters.ObjectParaseResult<Paramaters.Body>;
        query: Paramaters.ObjectParaseResult<Paramaters.Query>;
        headers: Binder.ConvertHeaderObjectToType<Paramaters.Headers>;
        url: DynamicURL.Extracted<any>;
        binder: Binder.Generic;
        middleware: object;
    }

    interface ReturnableObject {
        status: StatusBuilder.Status | number;
        body?: any;
        content_type?: string;
    }

    type ExecutableReturnable =
        Promise<ReturnableObject> |
        Promise<RouterError> |
        ReturnableObject |
        RouterError;

    type Executable<
        Request extends Binder.Request<any, any, any, any, any>
    > = (request: Request) => ExecutableReturnable;

    namespace StatusBuilder {

        type Category =
            'SUCCESS' |
            'REDIRECT' |
            'CLIENT_ERROR' |
            'CLIENT' |
            'SERVER_ERROR' |
            'SERVER';

        type SuccessStatus =
            { code: 200, name: 'OK' } |
            { code: 201, name: 'CREATED' } |
            { code: 202, name: 'ACCEPTED' } |
            { code: 204, name: 'NO_CONTENT' } |
            { code: 205, name: 'RESET_CONTENT' } |
            { code: 206, name: 'PARTIAL_CONTENT' } |
            { code: 207, name: 'MULTI_STATUS' } |
            { code: 208, name: 'ALREADY_REPORTED' };

        type RedirectStatus =
            { code: 300, name: 'MULTIPLE_CHOICES' } |
            { code: 301, name: 'MOVED_PERMANENTLY' } |
            { code: 302, name: 'FOUND' } |
            { code: 303, name: 'SEE_OTHER' } |
            { code: 304, name: 'NOT_MODIFIED' } |
            { code: 305, name: 'USE_PROXY' } |
            { code: 306, name: 'SWITCH_PROXY' } |
            { code: 307, name: 'TEMPORARY_REDIRECT' } |
            { code: 308, name: 'PERMANENT_REDIRECT' };

        type ClientErrorStatus =
            { code: 400, name: 'BAD_REQUEST' } |
            { code: 401, name: 'UNAUTHORIZED' } |
            { code: 402, name: 'PAYMENT_REQUIRED' } |
            { code: 403, name: 'FORBIDDEN' } |
            { code: 404, name: 'NOT_FOUND' } |
            { code: 405, name: 'METHOD_NOT_ALLOWED' } |
            { code: 406, name: 'NOT_ACCEPTABLE' } |
            { code: 407, name: 'PROXY_AUTHENTICATION_REQUIRED' } |
            { code: 408, name: 'REQUEST_TIMEOUT' } |
            { code: 409, name: 'CONFLICT' } |
            { code: 410, name: 'GONE' } |
            { code: 411, name: 'LENGTH_REQUIRED' } |
            { code: 412, name: 'PRECONDITION_FAILED' } |
            { code: 413, name: 'PAYLOAD_TOO_LARGE' } |
            { code: 414, name: 'URI_TOO_LONG' } |
            { code: 415, name: 'UNSUPPORTED_MEDIA_TYPE' } |
            { code: 416, name: 'RANGE_NOT_SATISFIABLE' } |
            { code: 417, name: 'EXPECTATION_FAILED' } |
            { code: 418, name: 'IM_A_TEAPOT' } |
            { code: 421, name: 'MISDIRECTED_REQUEST' } |
            { code: 422, name: 'UNPROCESSABLE_ENTITY' } |
            { code: 423, name: 'LOCKED' } |
            { code: 424, name: 'FAILED_DEPENDENCY' } |
            { code: 425, name: 'TOO_EARLY' } |
            { code: 426, name: 'UPGRADE_REQUIRED' } |
            { code: 428, name: 'PRECONDITION_REQUIRED' } |
            { code: 429, name: 'TOO_MANY_REQUESTS' } |
            { code: 431, name: 'REQUEST_HEADER_FIELDS_TOO_LARGE' } |
            { code: 451, name: 'UNAVAILABLE_FOR_LEGAL_REASONS' };

        type ServerErrorStatus =
            { code: 500, name: 'INTERNAL_SERVER_ERROR' } |
            { code: 501, name: 'NOT_IMPLEMENTED' } |
            { code: 502, name: 'BAD_GATEWAY' } |
            { code: 503, name: 'SERVICE_UNAVAILABLE' } |
            { code: 504, name: 'GATEWAY_TIMEOUT' } |
            { code: 505, name: 'HTTP_VERSION_NOT_SUPPORTED' } |
            { code: 506, name: 'VARIANT_ALSO_NEGOTIATES' } |
            { code: 507, name: 'INSUFFICIENT_STORAGE' } |
            { code: 508, name: 'LOOP_DETECTED' } |
            { code: 510, name: 'NOT_EXTENDED' } |
            { code: 511, name: 'NETWORK_AUTHENTICATION_REQUIRED' };



        type Success =
            `${SuccessStatus['code']}_${SuccessStatus['name']}`;

        type Redirect =
            `${RedirectStatus['code']}_${RedirectStatus['name']}`;

        type ClientError =
            `${ClientErrorStatus['code']}_${ClientErrorStatus['name']}`;

        type ServerError =
            `${ServerErrorStatus['code']}_${ServerErrorStatus['name']}`;



        type Status =
            Success |
            Redirect |
            ClientError |
            ServerError;
    }
}



declare namespace DynamicURL {

    type StartsWithColon<str extends string> =
        str extends `:${infer _}` ? true : false;

    type RemoveStartingColons<str extends string> =
        StartsWithColon<str> extends true ?
        str extends `:${infer right}` ? RemoveStartingColons<right> :
        str : str;

    type HasColonLeft<str extends string> =
        str extends `${infer _}:${infer __}` ? true : false;

    type RemoveRegex<str extends string> =
    // -- Regex params look like this :param(regex)whatever
    //    So we need to remove the regex part and everything after it
    //    so were left with :param
    str extends `${infer left}(${infer _})${infer __}`
        ? left
        : str;

    type Extract<str extends string, res extends Array<string> = []> =
        HasColonLeft<str> extends false ? res :
        str extends `${infer l}:${infer r}` ?
        HasColonLeft<r> extends false ? [...res, RemoveRegex<r>] :
        StartsWithColon<r> extends true ? Extract<RemoveStartingColons<r>, res> :
        r extends `${infer l2}:${infer r2}` ? Extract<`:${r2}`, [...res, RemoveRegex<l2>]> :
        never : never;

    type ArrayToObject<Arr extends Array<string>> = {
        [Key in Arr[number]]: string;
    }

    type Extracted<str extends string> = ArrayToObject<Extract<str>>;
}