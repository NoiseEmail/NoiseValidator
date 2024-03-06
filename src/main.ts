import Log from './logger/log';
import Router from './router/router';
import Route from './router/route';
import Binder from './binder/binder';
import GenericMiddleware from './middleware/middleware';


const router = Router.instance;
router.start();

class AuthMiddleware extends GenericMiddleware.Builder({
    body_schema: {
        test: (value, reject) => {
            if (value !== 'test') reject('Invalid value');
        }
    }
})<{
    id: string | null
}>() {
    public handler = () => {
        Log.info('Body:', this.body);
        Log.info('Query:', this.query);        
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
        aaa: ()=>'string'
    },

    // header_schema: {
    //     test: true
    // },

    handler(request) {
        Log.info('Query:', request.query);
        Log.info('Body:', request.middleware);


        request.set_header('test', 'test');

        return Binder.respond(200, 'Balls')
    },
})

router.add_route(route);
