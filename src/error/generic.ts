import { v4 as uuidv4 } from 'uuid';
import { SerializedGenericError } from './types.d';



export class GenericError extends Error {
    private _other_errors: Map<string, GenericError> = new Map();

    protected readonly _id: string = uuidv4();
    protected readonly _message: string;
    protected readonly _code: number;
    protected readonly _type: string = this.constructor.name;
    protected _data: object = {};
    protected _hint: string = '';

    public constructor(
        message: string,
        code: number,
        type?: string
    ) {
        super(message);
        this._message = message;
        this._code = code;
        if (type) this._type = type;
    }

    // -- Function that should be overridden by child classes
    public serialize = (): SerializedGenericError => {
        return {
            id: this._id,
            message: this._message,
            code: this._code,
            data: this._data,
            hint: this._hint,
            type: this._type,
            errors: this.errors.map((error) => error.serialize())
        };
    };  



    public static deserialize = (serialized: SerializedGenericError): GenericError => {
        return new DeserializedGenericError(serialized);
    }
        


    public get errors(): Array<GenericError> {
        const existing_ids = new Set<string>();
        return Array.from(this._other_errors.values()).filter((error) => {
            if (existing_ids.has(error.id)) return false;
            existing_ids.add(error.id);
            return true;
        });
    }


    public toString(): string {
        return JSON.stringify(this.serialize());
    }

    public set data(data: object) { this._data = data; }
    public get data(): object { return this._data; }

    public get hint(): string { return this._hint; }
    public set hint(hint: string) { this._hint = hint; }


    public get id(): string { return this._id; }
    public get message(): string { return this._message; }
    public get code(): number { return this._code; }
    public get type(): string { return this._type; }


    public add_error = (error: GenericError): void => {
        // -- Ensure that the error is not already in the map
        if (this._other_errors.has(error.id)) return;
        
        // -- Ensure that we are not adding ourselves to the map
        if (error.id === this._id) return;

        // -- Add the error to the map
        this._other_errors.set(error.id, error);
    };



    public static is_error = (error: unknown): boolean => {
        // -- If the error is anything bar a class its 100% not a generic error
        if (typeof error !== 'object' || error === null) return false;
        return (
            error instanceof GenericError || 
            error instanceof Error ||
            ['id', 'message', 'code', 'type', 'data'].every((key) => key in error)
        );
    };


    
    public static from_error = (error: Error): GenericError => {
        return new GenericError(error.message, 500);
    };



    public static from_unknown = (
        error: unknown,
        else_error: GenericError = new GenericError('An unknown error occurred', 500),
        hint?: string
    ): GenericError => {
        let return_error = else_error;
        
        if (error instanceof GenericError) return_error = error;
        else if (error instanceof Error) return_error = GenericError.from_error(error);
        else if (typeof error === 'string') return_error = new GenericError(error, 500);
        if (hint) return_error.hint = hint;

        return return_error;
    };
};



export class DeserializedGenericError extends GenericError {
    protected readonly _id: string;
    protected readonly _message: string;
    protected readonly _code: number;
    protected readonly _type: string;
    protected _data: object;
    protected _hint: string;

    public constructor(serialized: SerializedGenericError) {
        super(serialized.message, serialized.code, serialized.type);
        this._id = serialized.id;
        this._message = serialized.message;
        this._code = serialized.code;
        this._data = serialized.data;
        this._hint = serialized.hint || '';
        this._type = serialized.type;
        serialized.errors.forEach((error) => 
            this.add_error(new DeserializedGenericError(error)));
    }
}