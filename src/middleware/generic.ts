import CookieParser from 'cookie';
import Log from '@logger';
import { GenericError } from '@error';
import { MiddlewareValidationError } from './errors';
import { MiddlewareGenericError, MissingMiddlewareHandlerError } from './errors';
import { MiddlewareNamespace } from './types.d';
import { SchemaNamespace } from '@schema/types';


export default class GenericMiddleware<
    ReturnType extends unknown | Promise<unknown> = unknown,
    RequestObject extends MiddlewareNamespace.AnyMiddlewareRequestObject = MiddlewareNamespace.AnyMiddlewareRequestObject
> extends MiddlewareNamespace.GenericMiddlewareLike<ReturnType, RequestObject> {

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
};