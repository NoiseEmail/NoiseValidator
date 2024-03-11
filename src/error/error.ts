import { randomUUID } from 'crypto';
import { GenericError as GenericErrorTypes } from './types.d';
import log from '../logger/log';

export class GenericError extends GenericErrorTypes.GenericErrorLike {
    protected readonly _id: string = randomUUID();
    protected readonly _message: string;
    protected readonly _code: number;
    protected readonly _type: string = this.constructor.name;
    protected _data: object = {};

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

    public log = (): void => {
        log.error(`Return code: ${this._code} - ${this._message}`);
    };

    // -- Function that should be overridden by child classes
    public serialize = (): string => {
        return JSON.stringify({
            id: this._id,
            message: this._message,
            code: this._code,
            type: this._type,
            ...this._data
        });
    };  


    public set data(data: object) { this._data = data; }
    public get data(): object { return this._data; }


    public get id(): string { return this._id; }
    public get message(): string { return this._message; }
    public get code(): number { return this._code; }
    public get type(): string { return this._type; }
}