import { GenericError } from '../error/error';
import { GenericError as GenericErrorTypes } from '../error/types';
import log from '../logger/log';
import { MissingHandlerError, InvalidInputError } from './errors';
import { Schema } from './types.d';

export default class GenericType <
    ReturnType extends unknown = unknown
> extends Schema.GenericTypeLike<ReturnType> {   

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
    ): ReturnType | GenericErrorTypes.GenericErrorLike => {
        return new MissingHandlerError(`Handler not implemented for ${this.constructor.name}`);
    };

    protected invalid = (
        error: GenericErrorTypes.GenericErrorLike | string
    ): GenericErrorTypes.GenericErrorLike => {
        if (typeof error === 'string') error = new InvalidInputError(error);
        this._on_invalid(error);
        return error;
    };


    
    protected get value(): unknown {
        return this._input_value;
    }

    public execute = async (
    ) => {
        try { 
            const value = await this.handler(this._input_value); 
            if (value instanceof GenericError) this._on_invalid(value);
            else this._on_valid(value as ReturnType);
        }
        catch (error) {
            const message = `An error occurred trying to execute ${this.constructor.name}`;
            log.error(message, error);
            this._on_invalid(new InvalidInputError(message));
        }
    }
};



/**
 * @name execute
 * @description Executes a class constructor with a given input value
 * 
 * @param {Constructor} class_constructor The class constructor to execute
 * @param {unknown} input_value The input value to pass to the class constructor
 * @param {() => void} on_invalid The callback to call if the input value is invalid
 * @param {(value: unknown) => void} on_valid The callback to call if the input value is valid
 * 
 * @returns {Promise<void>} A promise that resolves when the class constructor has been executed
 */
export async function execute<
    Constructor extends Schema.GenericTypeConstructor<any>
>(
    class_constructor: Constructor,
    input_value: unknown,
    on_invalid: (error: GenericErrorTypes.GenericErrorLike) => void,
    on_valid: (value: unknown) => void
): Promise<Schema.GenericTypeLike<any>> {
    let invalid_executed = false, valid_executed = false;

    const instance = new class_constructor(
        input_value, 
        (error) => {
            if (invalid_executed || valid_executed) return;
            invalid_executed = true;
            on_invalid(error);
        }, 
        (value) => {
            if (invalid_executed || valid_executed) return;
            valid_executed = true;
            on_valid(value);
        }
    );

    await instance.execute();
    return instance;
}