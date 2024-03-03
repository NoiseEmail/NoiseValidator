export default class CompileSchema {
    
    private readonly _body: boolean = true;
    private readonly _query: boolean = true;
    private readonly _headers: boolean = true;

    public constructor({
        body = true,
        query = true,
        headers = true
    } = {}) {
        this._body = body;
        this._query = query;
        this._headers = headers;
    };

    

    public static All = () => new CompileSchema({
        body: true,
        query: true,
        headers: true
    });

    public static Body = () => new CompileSchema({
        body: true,
        query: false,
        headers: false
    });

    public static Query = () => new CompileSchema({
        body: false,
        query: true,
        headers: false
    });

    public static Headers = () => new CompileSchema({
        body: false,
        query: false,
        headers: true
    });

    public static None = () => new CompileSchema({
        body: false,
        query: false,
        headers: false
    });



    public get body(): boolean { return this._body; }
    public get query(): boolean { return this._query; }
    public get headers(): boolean { return this._headers; }
}