import Binder from '../binder/binder';
import Log from '../logger/log';
import { Router } from './types';

export default class RouterError {
    private readonly _message: String;
    private readonly _data: any = null;
    private readonly _error_code: number;

    private _path: Array<String> = [];

    public constructor(
        error_code: Router.StatusBuilder.Status | number,
        message: String,
        data?: any
    ) {
        this._error_code = Binder.response_code(error_code);
        this._message = message;
        this._data = data;

        if (this._error_code < 400 || this._error_code >= 600)
            Log.warn(`RouterError: Invalid status code ${this._error_code} provided. Defaulting to 500`);

        if (this._error_code >= 500 && this._error_code < 600)
            Log.warn(`RouterError: ${this._error_code} - ${message}`);
    }

    public set path(path: Array<String>) {
        this._path = path;
    }


    public get serialized(): {
        message: String,
        data: any,
        path: Array<String>,
        code: number
    } {
        return {
            message: this._message,
            data: this._data,
            path: this._path,
            code: this._error_code
        }
    }
}