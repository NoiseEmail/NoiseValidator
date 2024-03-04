import Log from './logger/log';
import Router from './router/router';
import Route from './router/route';
import Binder from './binder/binder';
import GenericMiddleware from './middleware/middleware';
import CompileSchema from './binder/schema';

const router = Router.instance;
router.start();



class SessionMiddleware extends GenericMiddleware.Builder<{
    id: string | null
}>({
    compilable_schemas: CompileSchema.All(),
    headers_schema: {
        'x-session-id': true
    }
}) {
    public handler = () => {
        // const data = this.headers.;
        
        this.continue({
            id: 'BLAH'
        });
    };
};

class AuthMiddleware extends GenericMiddleware.Builder<{
    perms: Array<string>
}>({
    compilable_schemas: CompileSchema.All(),
    headers_schema: {
        'x-session-id': true
    }
}) {
    public handler = () => {
        // const data = this.headers.;
        
        this.continue({
            perms: ['test']
        });
    };
};




const route = Route.new({
    path: '/what/:digit(^\\d+).png:balls',
    friendly_name: 'Test'
});

Binder.new(route, {
    method: 'GET',


    middleware: {
        session: new SessionMiddleware(),
        more: new SessionMiddleware(),
        auth: new AuthMiddleware()
    },


    query_schema: {
        test: 'Optional<boolean>',
    },

    body_schema: {
        tes2:'string'
    },

    headers_schema: {
        test: false
    },

    handler(request) {
        Log.info('Query:', request.query);
        Log.info('Body:', request.body);
        Log.info('Headers:', request.headers);
        Log.info('URL:', request.url);

        Log.info('SESSION ID:', request.middleware.auth.perms);

        request.set_header('test', 'test');

        return Binder.respond(200, 'Balls')
    },
})

router.add_route(route);

