import { LogFunctions, LogObject, LogType } from "../logger/types";
import { Middleware } from "./types.d";
import { GenericError as GenericErrorTypes } from '../error/types';
import { MiddlewareGenericError, MissingMiddlewareHandlerError } from "./errors";
import { log_header } from "../logger/log";
import { log_types } from "../logger/type_enum";
import { GenericError } from "../error/generic";
import { Schema } from "../schema/types";
import { execute, Schema as SchemaClass } from "../schema";


export default class GenericMiddleware <
    ReturnType extends unknown | Promise<unknown> = unknown,
    RequestObject extends Middleware.AnyMiddlewareRequestObject = Middleware.AnyMiddlewareRequestObject
> extends Middleware.GenericMiddlewareLike<ReturnType, RequestObject> {

    public readonly _return_type: ReturnType = {} as ReturnType;
    protected _validated: ReturnType | undefined;
    private _executed: boolean = false;
    private _log_stack: Array<LogObject> = [];


    protected readonly _request_object: RequestObject;
    protected readonly _on_invalid: (error: GenericErrorTypes.GenericErrorLike) => void;
    protected readonly _on_valid: (result: ReturnType) => ReturnType;

    

    public constructor(
        _request_object: RequestObject,
        _on_invalid: (error: GenericErrorTypes.GenericErrorLike) => void,
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
        Promise<GenericErrorTypes.GenericErrorLike> | 
        GenericErrorTypes.GenericErrorLike => {
        return new MissingMiddlewareHandlerError(`Handler not implemented for ${this.constructor.name}`);
    };

    protected invalid = (
        error: GenericErrorTypes.GenericErrorLike | string
    ): GenericErrorTypes.GenericErrorLike => {
        if (typeof error === 'string') error = new MiddlewareGenericError(error);
        error.data = { middleware: this.constructor.name }
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
        SchemaType extends Schema.SchemaType,
        SchemaInput extends SchemaClass<any>,
        ReturnType extends SchemaInput["_return_type"]
    >(
        input_type: SchemaType,
        schema: SchemaInput
    ): Promise<ReturnType> => {

        // -- Validate the input type
        const valid_types = ['body', 'query', 'headers', 'cookies'];
        if (!valid_types.includes(input_type))
            throw new MiddlewareGenericError(`Invalid input type: ${input_type}`);

        let data;
        switch (input_type) {
            case 'body': data = this._request_object.fastify.request.body; break;
            case 'query': data = this._request_object.fastify.request.query; break;
            case 'headers': data = this._request_object.fastify.request.headers; break;
            // -- TODO: Add cookies, Fastify doesn't have a cookies object
            case 'cookies': data = {}; break;
        };


        // -- Validate the input
        const result = await schema.validate(data);
        if (result.type === 'error') {
            this.log.error(`Invalid input for ${input_type}`, result.error.serialize());
            throw result.error;
        }

        // -- Return the result
        return result.data as ReturnType;
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
    public static get name(): string { return this.name; }



    /**
     * @name log_stack
     * @description A stack of log messages that have been generated
     * during the execution of the handler
     * 
     * NOTE: If the handler has not been executed, or if the handler
     * is still executing, the log stack will either be empty or incomplete
     * 
     * @type {Array<LogObject>}
     */
    public get log_stack(): Array<LogObject> { return this._log_stack; }



    /**
     * @name log
     * @description A set of logging functions, these will be stored
     * within the instance and can be used to log information about the
     * specific instance / request, etc.
     * 
     * Really handy for tracing down specifc user errors, etc.
     * 
     * @type {LogFunctions}
     * @example
     * 
     * // -- Log a debug message
     * this.log.debug('This is a debug message');
     * 
     * // -- Throw an error, this will casue the request to fail
     * this.log.throw('This is an error message');
     */
    public log: LogFunctions = {
        debug: (...args: unknown[]) => this._log(log_types.DEBUG, ...args),
        error: (...args: unknown[]) => this._log(log_types.ERROR, ...args),
        info: (...args: unknown[]) => this._log(log_types.INFO, ...args),
        warn: (...args: unknown[]) => this._log(log_types.WARN, ...args),
        throw: (...args: unknown[]) => this._log(log_types.THROW, ...args),
    }



    private _log = (
        log_type: LogType,
        ...args: unknown[]
    ) => {
        const header = log_header(log_type);
        this._log_stack.push({
            args,
            type: log_type,
            header,
            date: new Date(),
            group: this.constructor.name
        });
    };



    /**
     * @name execute
     * @description Executes the handler function, it should only be called
     * by an outside source, such as a factory function, etc.
     * 
     * @returns {Promise<void>} A promise that resolves when the handler has been executed
     */
    public execute = async () => {
        if (this._executed) return this.log.error('This instance has already been executed');
        this._executed = true;
        
        try { 
            const value = await this.handler(this._request_object); 
            if (value instanceof GenericError) {
                this.log.error(`Handler executed with an error`, value.serialize());
                return this._on_invalid(value);
            }

            this.log.info(`Handler executed successfully`);
            this._validated = value as ReturnType;
            this._on_valid(value as ReturnType);
        }

        catch (error) {
            const message = new MiddlewareGenericError(`An error occurred trying to execute ${this.constructor.name}`);
            this.log.error(message.serialize());
            this._on_invalid(message);
        }
    }
    
};