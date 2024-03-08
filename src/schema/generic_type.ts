import log from '../logger/log';
import { Schema } from './types.d';

export default class GenericType <
    ReturnType extends unknown = unknown
> extends Schema.GenericTypeLike<ReturnType> {   

    protected readonly _input_value: unknown;
    protected readonly _on_valid: (value: ReturnType) => void;
    protected readonly _on_invalid: () => void;
    
    public constructor(
        _input_value: unknown,
        _on_valid: (value: ReturnType) => void,
        _on_invalid: () => void
    ) {
        super(_input_value, _on_valid, _on_invalid);
        this._input_value = _input_value;
        this._on_valid = _on_valid;
        this._on_invalid = _on_invalid;
    };




    protected handler = (): ReturnType => {
        throw log.throw(`No handler implemented for ${this.constructor.name}!`);
    };

    


    protected valid = (
        return_value: ReturnType
    ): void => {
        try { this._on_valid(return_value); }
        catch (error) { this._on_invalid(); }
    };

    protected invalid = (
    ): void => {
        try { this._on_invalid(); }
        catch (error) { this._on_invalid(); }
    }
};



export function execute<
    Constructor extends Schema.GenericTypeConstructor<any>
>(
    class_constructor: Constructor,
    input_value: unknown,
    on_valid: (value: unknown) => void,
    on_invalid: () => void = () => {}
) {
    // Create an instance of the class
    const instance = new class_constructor(input_value, on_valid, on_invalid);

    // Execute the instance
    // instance.execute();
}