import { Paramaters } from '../binder/types';

export default class ParserError {

    private readonly _path: Array<String>;
    private readonly _message: String;
    private readonly _parameter: Paramaters.All;
    private readonly _input: any;
    private readonly _details: Paramaters.Parsed;

    public constructor(
        path: Array<String>,
        message: String,
        parameter: Paramaters.All,
        input: any,
        details: Paramaters.Parsed
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
    public get parameter(): Paramaters.All { return this._parameter; }
    public get input(): any { return this._input; }
    public get details(): Paramaters.Parsed { return this._details; }
}