import * as nv from './src';



class MiddlewareExecutionError extends nv.GenericError {
    public constructor(
        message: string
    ) {
        super(message, 500);
    }
}



const server = new nv.Server();
const route = new nv.Route(server, '/test');

class MW extends nv.GenericMiddleware {
    protected handler = async () => {
        console.log('Middleware executed');
        throw new MiddlewareExecutionError('Middleware error');
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




server.start();



const test = nv.register_api_route('localhost:8080', '/test', 'GET', {});
const res = await test({

})

console.log(res.success);

