import { Binder, Paramaters } from '../binder/types';
import RouterError from '../router/error';

declare namespace Middleware {

    /**
     * @name Function
     * The middleware function type
     */
    type Function<
        DataShape extends any,
        DynamicUrl extends Paramaters.FlatObject,
        Body extends Paramaters.NestedObject,
        Query extends Paramaters.FlatObject,
        Headers extends Paramaters.FlatObject
    > = (
        request: Binder.Request<
            DynamicUrl,
            Body,
            Query,
            Headers
        >,

        next: () => Promise<DataShape | void> | DataShape | void,
        stop: (error: RouterError) => void
        
    ) => Promise<void> | void;



    type Class<
        DataShape extends any,

        Body extends Paramaters.NestedObject,
        Query extends Paramaters.FlatObject,
        Headers extends Paramaters.FlatObject,

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
    > = {

        handler: (
            request: Request
        ) => Promise<DataShape | void> | DataShape | void;
    };


    type AnyClass = Class<any, any, any, any, any, any, any, any>;
    

}