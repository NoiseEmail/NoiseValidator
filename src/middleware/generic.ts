import CookieParser from 'cookie';
import Log from '@logger';
import { GenericError } from '@error';
import { MiddlewareGenericError, MissingMiddlewareHandlerError } from './errors';
import { MiddlewareNamespace } from './types.d';
import { SchemaNamespace } from '@schema/types';


export default class GenericMiddleware<
    ReturnType extends unknown | Promise<unknown> = unknown,
    RequestObject extends MiddlewareNamespace.AnyMiddlewareRequestObject = MiddlewareNamespace.AnyMiddlewareRequestObject
> extends MiddlewareNamespace.GenericMiddlewareLike<ReturnType, RequestObject> {

    public readonly _return_type: ReturnType = {} as ReturnType;
    protected _validated: ReturnType | undefined;
    private _executed: boolean = false;


    protected readonly _request_object: RequestObject;
    protected readonly _on_invalid: (error: GenericError) => void;
    protected readonly _on_valid: (result: ReturnType) => ReturnType;

    

    public constructor(
        _request_object: RequestObject,
        _on_invalid: (error: GenericError) => void,
        _on_valid: (result: ReturnType) => ReturnType
    ) {
        super(_request_object, _on_invalid, _on_valid);
        this._request_object = _request_object;
        this._on_invalid = _on_invalid;
        this._on_valid = _on_valid;
    };



    protected handler = (
        input_value: unknown,
    ): 
        ReturnType | 
        Promise<ReturnType> |  
        Promise<GenericError> | 
        GenericError => 
    {
        // -- By default, throw an error, as each middleware should implement their own handler
        return new MissingMiddlewareHandlerError(`Handler not implemented for ${this.constructor.name}`);
    };

    protected invalid = (
        error: GenericError | string
    ): GenericError => {
        // -- Construct the error
        if (typeof error === 'string') error = new MiddlewareGenericError(error);
        error.data = { middleware: this.constructor.name };

        // -- Return the error
        this._on_invalid(error);
        return error;
    };

    protected valid = (result: ReturnType): ReturnType => {
        this._validated = result;
        this._on_valid(result);
        return result;
    };



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
    public execute = async () => {
        if (this._executed) return Log.error('This instance has already been executed');
        this._executed = true;
        
        try { 
            const value = await this.handler(this._request_object); 

            // -- We check for error instead of generic error as we dont
            //    want to miss anything here
            if (value instanceof Error) {

                // -- Make sure to return a generic error not just any error
                Log.debug(`Schema handler failed to execute`);
                const error = GenericError.from_unknown(value);
                return this._on_invalid(error);
            }

            Log.debug(`Middleware handler executed successfully`);
            this._validated = value;
            this._on_valid(value);
        }

        catch (unknown_error) {
            // -- Convert anything to a generic error
            const error = GenericError.from_unknown(
                unknown_error,
                new MiddlewareGenericError(`An error occurred trying to execute ${this.constructor.name}`)
            );  

            // -- Log and return the error
            Log.debug(`An error occurred trying to execute ${this.constructor.name}: ${error.id}`);
            Log.error(error.serialize());
            this._on_invalid(error);
        }
    }  
};