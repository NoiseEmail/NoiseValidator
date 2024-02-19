import Log from './logger/log';
import Fastify from 'fastify';
import Router from "./router/router";
import Route from "./router/route";
import {validate_object} from "./router/parser/parser";


const router = Router.instance;
router.start();


// server.get('/', async (request, reply) => {
//     return { hello: 'world' };
// });

router.add_route(Route.new({
    configuration: {
        path: ['test'],
        friendly_name: 'Test'
    },

    binders: [
        {
            method: 'GET',

            required_query: {
                'test': 'string',
                'test2': 'Optional<string>',
                'a': {
                    'test': 'number',
                    'test2': 'Optional<number>',
                    'custom': (value, reject): boolean => {
                        return true;
                    }
                }
            },

            handler(request) {
                const a = request.query.a.test2;
                Log.info(a);
            }
        }
    ]
}));


const obj = validate_object({
    'test': 'string',
    'test2': 'Optional<string>',
    'a': {
        'test': 'boolean',
        'test2': 'Optional<number>',
        'custom': (value, reject): boolean => {
            console.log(13234623456345263456);
            return true;
        }
    }
}, {
    'test': 'asdasd',
    'test2': 'asdasd',
    'a': {
        'test': true,
        'custom': 'a'
    }
}).then((result) => {
    Log.info(result);
});