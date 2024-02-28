import Log from './logger/log';
import Router from "./router/router";
import Route from "./router/route";
import Binder from "./router/binder";
import { RouterTypes } from './router/types';

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

    required_query: {
        test: 'Optional<boolean>',
    },

    required_body: {
        tes2:'string'
    },

    handler(request) {
        Log.info('Query:', request.body.tes2);
        request.set_header('test', 'test');

        return Binder.respond(200, 'Balls')
    },
})

router.add_route(route);