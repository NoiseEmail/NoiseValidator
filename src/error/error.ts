import { randomUUID } from "crypto";
import { GenericError as GenericErrorTypes } from "./types.d";
import log from "../logger/log";

export class GenericError extends GenericErrorTypes.GenericErrorLike {
    protected readonly _id: string = randomUUID();
    protected readonly _message: string;
    protected readonly _code: number;
    protected readonly _type: string = this.constructor.name;

    public constructor(
        message: string,
        code: number,
        type?: string
    ) {
        super(message);
        this._message = message;
        this._code = code;
        if (type) this._type = type;
        this.log();
    }

    public log = (): void => {
        log.error(`Return code: ${this._code} - ${this._message}`);
    };

    // -- Function that should be overridden by child classes
    public serialize = (): string => {
        return JSON.stringify({
            id: this._id,
            message: this._message,
            code: this._code
        });
    };
}