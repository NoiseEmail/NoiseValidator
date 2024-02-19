import {RouterTypes} from "../types";

export default class ParserError {

    private readonly _path: Array<String>;
    private readonly _message: String;
    private readonly _parameter: RouterTypes.Binder.Parameter;
    private readonly _input: any;
    private readonly _details: RouterTypes.Binder.ParsedParameter;

    public constructor(
        path: Array<String>,
        message: String,
        parameter: RouterTypes.Binder.Parameter,
        input: any,
        details: RouterTypes.Binder.ParsedParameter
    ) {
        this._path = path;
        this._message = message;
        this._parameter = parameter;
        this._input = input;
        this._details = details;
    }



    public to_string = (): String => {
        return `ParserError: ${this._message} at ${this._path.join('.')}: ${this._input}`;
    }



    public get path(): Array<String> { return this._path; }
    public get message(): String { return this._message; }
    public get parameter(): RouterTypes.Binder.Parameter { return this._parameter; }
    public get input(): any { return this._input; }
    public get details(): RouterTypes.Binder.ParsedParameter { return this._details; }
}