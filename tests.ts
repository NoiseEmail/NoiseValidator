import * as nv from './src';



class MiddlewareExecutionError extends nv.GenericError {
    public constructor(
        message: string
    ) {
        super(message, 500);
    }
}


const err = new MiddlewareExecutionError('Middleware error');
console.log(err instanceof nv.GenericError);
console.log(MiddlewareExecutionError.from_unknown(err).serialize());



const server = new nv.Server();
const route = new nv.Route(server, '/test');

class MW extends nv.GenericMiddleware {
    protected handler = async () => {
        console.log('Middleware executed');
        throw new nv.GenericError('Middleware error', 410);
    }
}


nv.Binder(route, 'GET', {
    middleware: {
        test: MW,
    }
}, async ({

}) => {
    console.log('Route executed');
});


await server.start();