import Log from './logger/log';
import Router from "./router/router";
import Route from "./router/route";
import Binder from "./router/binder";


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
    path: ['test'],
    friendly_name: 'Test'
});


const other_bind = Binder.new({
    method: 'GET',
    handler(request) {
        Log.info('Test');

        return { hello: 'world' }
    },
});

route.bind(other_bind);
router.add_route(route);