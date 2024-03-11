import { GenericError } from '../error/error';
import { GenericError as GenericErrorTypes } from '../error/types';
import { MissingHandlerError, InvalidInputError } from './errors';
import { Schema } from './types.d';
import log from '../logger/log';


export default class GenericType <
    ReturnType extends unknown = unknown
> extends Schema.GenericTypeLike<ReturnType> {   

    protected readonly _input_value: unknown;
    protected readonly _on_invalid: (error: GenericErrorTypes.GenericErrorLike) => void;
    protected readonly _on_valid: (result: ReturnType) => void;
    protected _validated: ReturnType | undefined;

    
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

    protected valid = (result: ReturnType) => {
        this._validated = result;
        this._on_valid(result);
    }


    
    protected get value(): unknown {
        return this._input_value;
    }

    public get validated(): ReturnType | undefined {
        return this._validated;
    }

    public static get name(): string {
        return this.name;
    }



    public execute = async (
    ) => {
        try { 
            const value = await this.handler(this._input_value); 
            if (value instanceof GenericError) return this._on_invalid(value);

            this._validated = value as ReturnType;
            this._on_valid(value as ReturnType);
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
 * 
 * @returns {Promise<void>} A promise that resolves when the class constructor has been executed
 */
export async function execute<
    Constructor extends Schema.GenericTypeConstructor<any>
>(
    class_constructor: Constructor,
    input_value: unknown,
): Promise<GenericErrorTypes.GenericErrorLike | unknown> {
    let invalid_executed = false, valid_executed = false;

    return new Promise(async (resolve) => {
        const instance = new class_constructor(
            input_value, 
            (error) => {
                if (invalid_executed || valid_executed) return;
                invalid_executed = true;
                resolve(error);
            }, 
            (value) => {
                if (invalid_executed || valid_executed) return;
                valid_executed = true;
                resolve(value);
            }
        );

        await instance.execute();
    });
}