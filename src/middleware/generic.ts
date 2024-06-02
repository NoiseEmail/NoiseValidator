import CookieParser from 'cookie';
import { GenericError } from 'noise_validator/src/error';
import { MiddlewareValidationError } from './errors';
import { MiddlewareGenericError, MissingMiddlewareHandlerError } from './errors';
import { MiddlewareNamespace } from './types.d';
import { SchemaNamespace } from 'noise_validator/src/schema/types';
import { Cookie } from 'noise_validator/src/binder/types';


export default class GenericMiddleware<
    ReturnType extends unknown | Promise<unknown> = unknown,
    RequestObject extends MiddlewareNamespace.AnyMiddlewareRequestObject = MiddlewareNamespace.AnyMiddlewareRequestObject
> extends MiddlewareNamespace.GenericMiddlewareLike<ReturnType, RequestObject> {
    public static runtime = MiddlewareNamespace.MiddlewareRuntime.BEFORE;
    public readonly _return_type: ReturnType = {} as ReturnType;
    protected readonly _request_object: RequestObject;
    protected _validated: ReturnType | undefined;
    private _returned: boolean = false;
    private _executed: boolean = false;

    

    /**
     * This is what we call when we go to execute the middleware
     */
    public constructor(request_object: RequestObject) {
        super(request_object);
        this._request_object = request_object;
    };



    /**
     * This is a stand-in function that gets overriden by the extending class.
     */
    protected handler = (input_value: unknown): Promise<ReturnType> => { 
        throw new MissingMiddlewareHandlerError(`Handler not implemented for ${this.constructor.name}`); }

    protected set_header = (key: string, value: string, on: MiddlewareNamespace.ExecuteOn = 'on-success') => this._request_object.set_header(key, value, on);
    protected remove_header = (key: string) => this._request_object.remove_header(key);

    protected set_cookie = (name: string, cookie: Cookie.Shape, on: MiddlewareNamespace.ExecuteOn = 'on-success') => this._request_object.set_cookie(name, cookie, on);
    protected remove_cookie: (name: string) => void = (name: string) => this._request_object.remove_cookie(name);

    protected get body() { return this._request_object.body; }
    protected get query() { return this._request_object.query; }
    protected get headers() { return this._request_object.headers; }
    protected get request() { return this._request_object.fastify.request; }
    protected get reply() { return this._request_object.fastify.reply; }
    


    // -- NOTE: This function is meant to be called by the extending class
    //          so that it can validate its own inputs.
    /**
     * @name validate_input
     * @description This function validates incoming data against
     * a schema.
     * 
     * This function will throw by default, returning a GenericError
     * causing the request to fail.
     * 
     * @param {Schema.SchemaType} input_type - The type of the input
     * @param {Schema.SchemaLike<SchemaType>} schema - The schema to validate against
     * 
     * @returns {Promise<ReturnType>} A promise that resolves when the input has been validated
     */
    protected validate_input = async <
        SchemaType extends 'body' | 'query' | 'headers' | 'cookies',
        SchemaInput extends SchemaNamespace.SchemaLike<any>,
        ReturnType extends SchemaInput['_return_type']
    >(
        input_type: SchemaType,
        schema: SchemaInput
    ): Promise<ReturnType> => {

        let data;
        switch (input_type) {
            case 'body': data = this._request_object.fastify?.request?.body; break;
            case 'query': data = this._request_object.fastify?.request?.query; break;
            case 'headers': data = this._request_object.fastify?.request?.headers; break;
            case 'cookies': 
                let raw_cookie = data = this._request_object.fastify?.request?.headers?.cookie;
                if (!raw_cookie) raw_cookie = '';
                data = CookieParser.parse(raw_cookie);
                break;

            default: throw new GenericError(`Invalid input type: ${input_type}`, 500);
        };

        // -- Validate the input
        return await schema.validate(data) as ReturnType;
    };



    /**
     * @name name
     * @description The name of the class, this is used to identify the class
     * when logging, etc.
     * 
     * Can be overriden by the extending class, but it's not required.
     * 
     * @type {string}
     * @example
    * 
    * // -- Overriding the name
    * public static get name() {
    *    return `SomeWrapperClass<${input.name}>`;    
    * }
    */
    // deepcode ignore StaticAccessThis: Cant access on an inherited class
    public static get name(): string { return this.name; }



    /**
     * @name execute
     * @description Executes the handler function, it should only be called
     * by an outside source, such as a factory function, etc.
     * 
     * @returns {Promise<void>} A promise that resolves when the handler has been executed
     */
    public execute = async (): Promise<
        { data: ReturnType, success: true } |
        { data: GenericError, success: false }
    > => {

        // -- Check if the instance has already been executed
        if (this._executed) throw new MiddlewareValidationError('This instance has already been executed');
        if (this._returned) throw new MiddlewareValidationError('This instance has already returned');
        this._executed = true;

        // -- Execute the handler
        try { 
            const return_data = await this.handler(this._request_object); 
            this._returned = true;
            return { data: return_data, success: true };
        }

        catch (unknown_error) {
            const error = MiddlewareGenericError.from_unknown(
                unknown_error, 
                new MiddlewareGenericError(`An error occurred trying to execute ${this.constructor.name}`),
                this.constructor.name
            );
            
            return { data: error, success: false };
        };
    };



    public static extract_runtime_object = <
        ReturnObject extends MiddlewareNamespace.MiddlewareObject = MiddlewareNamespace.MiddlewareObject
    >(
        middleware: ({
            before?: MiddlewareNamespace.MiddlewareObject,
            after?: MiddlewareNamespace.MiddlewareObject
        } | MiddlewareNamespace.MiddlewareObject) | undefined
    ): ReturnObject => {
        let executable_middlewares: MiddlewareNamespace.MiddlewareObject = {};

        if (
            (middleware?.after !== undefined &&
            !(middleware?.after instanceof GenericMiddleware)) ||
            (middleware?.before !== undefined &&
            !(middleware?.before instanceof GenericMiddleware))
        ) executable_middlewares = { ...(middleware?.before ?? {}), ...(middleware?.after ?? {})};

        else executable_middlewares = (middleware ?? {}) as MiddlewareNamespace.MiddlewareObject;

        return executable_middlewares as ReturnObject;
    }
}