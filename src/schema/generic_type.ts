import { GenericError } from '../error/error';
import { GenericError as GenericErrorTypes } from '../error/types';
import log, { log_header } from '../logger/log';
import { log_types } from '../logger/type_enum';
import { LogFunctions, LogObject, LogType } from '../logger/types';
import { MissingHandlerError, InvalidInputError } from './errors';
import { Schema } from './types.d';


export default class GenericType <
    ReturnType extends unknown | Promise<unknown> = unknown
> extends Schema.GenericTypeLike<ReturnType> {   
    public readonly _return_type: ReturnType = {} as ReturnType;
    protected _validated: ReturnType | undefined;
    private _executed: boolean = false;
    private _log_stack: Array<LogObject> = [];

    protected readonly _input_value: unknown;
    protected readonly _on_invalid: (error: GenericErrorTypes.GenericErrorLike) => void;
    protected readonly _on_valid: (result: ReturnType) => void;

    
    public constructor(
        _input_value: unknown,
        _on_invalid: (error: GenericErrorTypes.GenericErrorLike) => void,
        _on_valid: (result: ReturnType) => void
    ) {
        super(_input_value, _on_invalid, _on_valid);
        this._input_value = _input_value;
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
        return new MissingHandlerError(`Handler not implemented for ${this.constructor.name}`);
    };

    protected invalid = (
        error: GenericErrorTypes.GenericErrorLike | string
    ): GenericErrorTypes.GenericErrorLike => {
        if (typeof error === 'string') error = new InvalidInputError(error);
        this._on_invalid(error);
        return error;
    };

    protected valid = (result: ReturnType) => {
        this._validated = result;
        this._on_valid(result);
    }


    
    /**
     * @name value
     * @description The input value that was passed to the class constructor
     * 
     * @type {unknown} - Anything could have been passed to the class constructor
     */
    public get value(): unknown { return this._input_value; }



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
    public execute = async (
    ) => {
        if (this._executed) return this.log.error('This instance has already been executed');
        this._executed = true;
        
        try { 
            const value = await this.handler(this._input_value); 
            if (value instanceof GenericError) {
                this.log.error(`Handler executed with an error`, value.serialize());
                return this._on_invalid(value);
            }

            this.log.info(`Handler executed successfully`);
            this._validated = value as ReturnType;
            this._on_valid(value as ReturnType);
        }

        catch (error) {
            const message = new InvalidInputError(`An error occurred trying to execute ${this.constructor.name}`);
            this.log.error(message.serialize());
            this._on_invalid(message);
        }
    }
};



/**
 * @name execute
 * @description Executes a class constructor with a given input value
 * 
 * @param {Constructor} class_constructor The class constructor to execute
 * @param {unknown} input_value The input value to pass to the class constructor
 * 
 * @returns {Promise<void>} A promise that resolves when the class constructor has been executed
 */
export async function execute<
    Constructor extends Schema.GenericTypeConstructor<any>,
    ReturnType extends Schema.ExtractParamaterReturnType<Constructor>
>(
    class_constructor: Constructor,
    input_value: unknown,
): Promise<{
    instance: Schema.GenericTypeLike;
    result: GenericErrorTypes.GenericErrorLike | ReturnType;
}> {
    let invalid_executed = false, valid_executed = false;

    return new Promise(async (resolve) => {
        const instance = new class_constructor(
            input_value, 
            (error) => {
                if (invalid_executed || valid_executed) return;
                invalid_executed = true;
                resolve({
                    instance,
                    result: error
                });
            }, 
            
            (value) => {
                if (invalid_executed || valid_executed) return;
                valid_executed = true;
                resolve({
                    instance,
                    result: value
                });
            }
        );

        await instance.execute();
    });
}