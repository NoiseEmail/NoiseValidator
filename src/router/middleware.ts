import { RouterTypes } from './types';



export default class GenericMiddleware<
    DataShape extends any,

    Body extends RouterTypes.Paramaters.Body,
    Query extends RouterTypes.Paramaters.Query,
    Headers extends RouterTypes.Paramaters.Headers,

    ParsedBody extends RouterTypes.Binder.ConvertObjectToType<Body>,
    ParsedQuery extends RouterTypes.Binder.ConvertObjectToType<Query>,
    ParsedHeaders extends RouterTypes.Binder.ConvertHeaderObjectToType<Headers>,

    Request extends RouterTypes.Binder.Request<
        {},
        // @ts-ignore
        ParsedBody,
        ParsedQuery,
        ParsedHeaders
    >
> {
    private readonly _id: String = Math.random().toString(36).substring(7);
    private _request: Request | null = null;

    

    /**
     * @name Builder
     * 
     * Returns a fully typed builder for the generic middleware.
     * 
     * @returns {GenericMiddleware} - Returns a fully typed builder for the generic middleware.
     */
    public static Builder = <DataShape = void> (configuration: {
        required_body?: RouterTypes.Paramaters.Body,
        required_query?: RouterTypes.Paramaters.Query,
        required_headers?: RouterTypes.Paramaters.Headers,
    }) => class extends GenericMiddleware<
        DataShape,
        RouterTypes.Paramaters.Body,
        RouterTypes.Paramaters.Query,
        RouterTypes.Paramaters.Headers,
        RouterTypes.Binder.ConvertObjectToType<RouterTypes.Paramaters.Body>,
        RouterTypes.Binder.ConvertObjectToType<RouterTypes.Paramaters.Query>,
        RouterTypes.Binder.ConvertHeaderObjectToType<RouterTypes.Paramaters.Headers>,
        RouterTypes.Binder.Request<
            {},
            // @ts-ignore
            RouterTypes.Binder.ConvertObjectToType<RouterTypes.Paramaters.Body>,
            RouterTypes.Binder.ConvertObjectToType<RouterTypes.Paramaters.Query>,
            RouterTypes.Binder.ConvertHeaderObjectToType<RouterTypes.Paramaters.Headers>
        >
    > { constructor() { super() } }



    protected continue = (
        data: DataShape
    ) => {};
    protected exit = () => {};



    protected get request(): Request {
        return this._request as Request;
    }

    protected get parsed_body(): ParsedBody {
        return this.request.body as ParsedBody;
    }

    public _set_request(request: Request) {
        this._request = request;
    }

    public get id(): String {
        return this._id;
    }
}


class NeedsName extends GenericMiddleware.Builder<{
    name: string
}>({
    required_body: { name: 'string' },
}) {

    public handler = () => {
        const data = this.parsed_body;
        
        this.continue({ 
            name: data.name
        });

        data.name;
    }
}


const middleware = new NeedsName()


let arr: Array<RouterTypes.Middleware.AnyClass> = [middleware];