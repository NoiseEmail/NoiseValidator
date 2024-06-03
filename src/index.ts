import { Array, Boolean, Enum, GenericType, GenericTypeExecutionError, InvalidInputError, MissingHandlerError, Number, Optional, Schema, SchemaExecutionError, SchemaMissingFieldError, SchemaTypes, String, Uuid } from './schema';
import { Binder, BinderFailedToExecuteError, BinderTypes, cookie, create_set_cookie_header, DefaultBinderConfiguration, FailedToValidateInputError, serialize_cookie, validate_binder_request } from './binder';
import { GenericError } from './error';
import { GenericMiddleware, MiddlewareGenericError, MissingMiddlewareHandlerError, MiddlewareTypes } from './middleware';
import { MethodNotAvailableError, NoRouteHandlerError, Route } from './route';
import { Server } from './server';
import { build_query_string, clean_url, execute_api_route, handle_error, register_api_route, replace_route_parameters } from './client';
import { Log, debug, error, info, log, log_header, log_types, throw_err, warn, is_debug } from './logger';



export {
    // -- Schema
    GenericType,
    Schema,
    MissingHandlerError,
    InvalidInputError,
    GenericTypeExecutionError,
    SchemaExecutionError,
    SchemaMissingFieldError,
    Boolean,
    String,
    Number,
    Uuid,
    Enum,
    Optional,
    Array,
    SchemaTypes,

    // -- Middleware
    GenericMiddleware,
    MiddlewareGenericError,
    MissingMiddlewareHandlerError,
    MiddlewareTypes,

    // -- Logger
    Log,
    debug,
    error,
    info,
    log,
    log_header,
    log_types,
    throw_err,
    warn,
    is_debug,
    
    // -- Error
    GenericError,

    // -- Binder
    Binder,
    DefaultBinderConfiguration,
    BinderFailedToExecuteError,
    FailedToValidateInputError,
    validate_binder_request,
    BinderTypes,

    // -- Server / Route
    Server,
    Route,
    MethodNotAvailableError,
    NoRouteHandlerError,

    // -- Cookie
    cookie,
    serialize_cookie,
    create_set_cookie_header,

    // -- Executor
    register_api_route,
    execute_api_route,
    handle_error,
    replace_route_parameters,
    build_query_string,
    clean_url,
};


class MW1 extends GenericMiddleware {
    protected handler = async (): Promise<void> => {
        console.log('Handler 1');
        this.set_header('test', 'test','on-failure');
        // throw new Error('Test');
    }
}

class MW2 extends GenericMiddleware {
    protected handler = async (): Promise<void> => {
        console.log('Handler 2');
        this.set_header('test2', 'test2','on-failure');
        // throw new Error('Test OTHER');
    }
}

class MW3 extends GenericMiddleware {
    protected handler = async (): Promise<void> => {
        console.log('Handler 3');
    }
}



const server = new Server({
  
});

const route = new Route(server, '/test', { 
    api_version: 'v1',
    middleware: {
        after: {
            test: MW1,
        },
        before: {
            test: MW2,
        }
    }
});


Binder(route, 'POST', {
    
}, async () => {
    console.log('Route hit');
    // throw new Error('Test');

    return { success: true };
});

server.start()