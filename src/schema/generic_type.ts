import log from '../logger/log';
import { Schema } from './types.d';

export default class GenericType <
    ReturnType extends unknown = unknown
> extends Schema.GenericTypeLike<ReturnType> {   

    protected readonly _input_value: unknown;
    protected readonly _on_invalid: () => void;

    private _valid: boolean = true;
    
    public constructor(
        _input_value: unknown,
        _on_invalid: () => void
    ) {
        super(_input_value, _on_invalid);
        this._input_value = _input_value;
        this._on_invalid = _on_invalid;
    };




    protected handler = (
        input_value: unknown,
        invalid: () => void
    ): ReturnType => {
        throw log.throw(`No handler implemented for ${this.constructor.name}!`);
    };

    


    protected invalid = (
    ): void => {
        this._valid = false;
    };


    protected get value(): unknown {
        return this._input_value;
    }


    public execute = async(
    ): Promise<ReturnType | void> => {
        try { 
            const value = this.handler(this._input_value, this.invalid); 
            if (this._valid) return value;
        }
        catch (error) {
            
        }
    }
};



export async function execute<
    Constructor extends Schema.GenericTypeConstructor<any>
>(
    class_constructor: Constructor,
    input_value: unknown,
    on_invalid: () => void = () => {},
    on_valid: (value: unknown) => void = () => {}
) {
    // Create an instance of the class
    const instance = new class_constructor(input_value, on_invalid),
        value = await instance.execute();

    // If the value is valid, call the on_valid callback
    if (value) on_valid(value);
    else on_invalid();
}