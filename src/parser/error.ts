import {RouterTypes} from "../router/types";

export default class ParserError {

    private readonly _path: Array<String>;
    private readonly _message: String;
    private readonly _parameter: RouterTypes.Paramaters.All;
    private readonly _input: any;
    private readonly _details: RouterTypes.Paramaters.Parsed;

    public constructor(
        path: Array<String>,
        message: String,
        parameter: RouterTypes.Paramaters.All,
        input: any,
        details: RouterTypes.Paramaters.Parsed
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
    public get parameter(): RouterTypes.Paramaters.All { return this._parameter; }
    public get input(): any { return this._input; }
    public get details(): RouterTypes.Paramaters.Parsed { return this._details; }
}