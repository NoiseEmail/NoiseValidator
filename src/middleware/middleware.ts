import { Binder, Paramaters } from '../binder/types';
import { Middleware } from './types';



export default class GenericMiddleware<
    DataShape extends any,

    Body extends Paramaters.Body,
    Query extends Paramaters.Query,
    Headers extends Paramaters.Headers,

    ParsedBody extends Binder.ConvertObjectToType<Body>,
    ParsedQuery extends Binder.ConvertObjectToType<Query>,
    ParsedHeaders extends Binder.ConvertHeaderObjectToType<Headers>,

    Request extends Binder.Request<
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
        required_body?: Paramaters.Body,
        required_query?: Paramaters.Query,
        required_headers?: Paramaters.Headers,
    }) => class extends GenericMiddleware<
        DataShape,
        Paramaters.Body,
        Paramaters.Query,
        Paramaters.Headers,
        Binder.ConvertObjectToType<Paramaters.Body>,
        Binder.ConvertObjectToType<Paramaters.Query>,
        Binder.ConvertHeaderObjectToType<Paramaters.Headers>,
        Binder.Request<
            {},
            // @ts-ignore
            Binder.ConvertObjectToType<Paramaters.Body>,
            Binder.ConvertObjectToType<Paramaters.Query>,
            Binder.ConvertHeaderObjectToType<Paramaters.Headers>
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


let arr: Array<Middleware.AnyClass> = [middleware];