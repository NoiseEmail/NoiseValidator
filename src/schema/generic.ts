import Log, { log_header, log_types } from '@logger';
import { GenericError } from '@error';
import { GenericTypeExecutionError, InvalidInputError, MissingHandlerError } from './errors';
import { LogFunctions, LogObject, LogType } from '@/logger/types';
import { SchemaNamespace } from './types.d';



export default class GenericType<
    ReturnType extends unknown | Promise<unknown> = unknown,
    InputShape extends unknown = unknown
> extends SchemaNamespace.GenericTypeLike<ReturnType> {   

    _validated: ReturnType | undefined;
    _executed: boolean = false;
    protected readonly _input_value: unknown;

    
    
    public constructor(
        _input_value: unknown
    ) {
        super(_input_value);
        this._input_value = _input_value;
    };



    protected handler = async (
        input_value: unknown,
    ): Promise<ReturnType> => {
        throw new MissingHandlerError(`Handler not implemented for ${this.constructor.name}`);
    };



    
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
    // file deepcode ignore StaticAccessThis: 
    public static get name(): string { return this.name; }




    /**
     * @name execute
     * @description Executes a class constructor with a given input value
     * 
     * @param {Constructor} class_constructor The class constructor to execute
     * @param {unknown} input_value The input value to pass to the class constructor
     * 
     * @returns {Promise<void>} A promise that resolves when the class constructor has been executed
     */
    public execute = async (): Promise<
        { data: ReturnType, success: true } | 
        { data: GenericError, success: false }
    > => {


        // -- Check if the instance has already been executed
        if (this._executed) throw new GenericTypeExecutionError('This instance has already been executed', this.constructor.name);
        this._executed = true;

        // -- Execute the handler
        try { 
            const return_data = await this.handler(this._input_value); 
            return { data: return_data, success: true };
        }

        catch (unknown_error) {
            const error = GenericError.from_unknown(
                unknown_error, 
                new GenericTypeExecutionError(`An error occurred trying to execute`, this.constructor.name),
                this.constructor.name
            );
            
            return { data: error, success: false };
        };

    }
}