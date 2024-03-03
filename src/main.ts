import Log from './logger/log';
import Router from './router/router';
import Route from './router/route';
import Binder from './binder/binder';

const router = Router.instance;
router.start();


// server.get('/', async (request, reply) => {
//     return { hello: 'world' };
// });

// router.add_route(Route.new({
//     path: ['test'],
//     friendly_name: 'Test'
// }));


const route = Route.new({
    path: '/what/:digit(^\\d+).png:balls',
    friendly_name: 'Test'
});

Binder.new(route, {
    method: 'GET',

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

        request.set_header('test', 'test');

        return Binder.respond(200, 'Balls')
    },
})

router.add_route(route);