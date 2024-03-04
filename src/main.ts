import Log from './logger/log';
import Router from './router/router';
import Route from './router/route';
import Binder from './binder/binder';
import GenericMiddleware from './middleware/middleware';


const router = Router.instance;
router.start();

class AuthMiddleware extends GenericMiddleware.Builder({
    body_schema: {
        test: ()=>'balls'
    }
})<{
    id: string | null
}>() {
    public handler = () => {
        Log.info('Body:', this.body);
        Log.info('Query:', this.query);

        Log.info('Headers:', this.headers);
        
    }
}


const route = Route.new({
    path: '/what',
    friendly_name: 'Test'
});

Binder.new(route, {
    method: 'POST',


    middleware: {
        session: AuthMiddleware
    },


    // query_schema: {
    //     test: 'Optional<boolean>',
    //     test2: 'string'
    // },

    body_schema: {
        // test:'string',
        test: ()=>'string'
    },

    // header_schema: {
    //     test: true
    // },

    handler(request) {
        // Log.info('Query:', request.query);
        // Log.info('Body:', request.body);
        // Log.info('Headers:', request.headers);
        // Log.info('URL:', request.url);

        // Log.info('SESSION ID:', request.middleware.session);
        // let a = request.body.wth[0]

        request.set_header('test', 'test');

        return Binder.respond(200, 'Balls')
    },
})

router.add_route(route);
