import Log from './logger/log';
import Router from './router/router';
import Route from './router/route';
import Binder from './binder/binder';
import GenericMiddleware from './middleware/middleware';


const router = Router.instance;
router.start();

class AuthMiddleware extends GenericMiddleware.Builder({
    header_schema: {
        'x-session-id': true
    },
    body_schema: {
        test1: 'Optional<boolean>',
        agh: 'string'
    },
    query_schema: {
        test: 'boolean',
        test2: 'Optional<string>'
    }
})<{
    id: string | null
}>() {
    private handler = (request) => {
        Log.info('Handler');
    }
}


const route = Route.new({
    path: '/what',
    friendly_name: 'Test'
});

Binder.new(route, {
    method: 'GET',


    middleware: {
        session: AuthMiddleware
    },


    query_schema: {
        test: 'Optional<boolean>',
        test2: 'string'
    },

    body_schema: {
        tes2:'string',
        wth: ()=>'string'
    },

    header_schema: {
        test: false
    },

    handler(request) {
        Log.info('Query:', request.query);
        Log.info('Body:', request.body);
        Log.info('Headers:', request.headers);
        Log.info('URL:', request.url);

        // Log.info('SESSION ID:', request.middleware.session);
        let a = request.body.wth[0]

        request.set_header('test', 'test');

        return Binder.respond(200, 'Balls')
    },
})

router.add_route(route);
