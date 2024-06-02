import { GenericError } from 'noise_validator/src/error';



class MethodNotAvailableError extends GenericError {
    public constructor(
        method: string
    ) {
        super(`Method ${method} is not served by this route`, 405);
    }
};

class NoRouteHandlerError extends GenericError {
    public constructor(
        message: string
    ) {
        super(message, 404);
    }
};

class RouteHandlerExecutedError extends GenericError {
    public constructor(
        message: string
    ) {
        super(message, 500);
    }
};

class UnkownRouteHandlerError extends GenericError {
    public constructor(
        message: string
    ) {
        super(message, 500);
    }
};

class MiddlewareExecutionError extends GenericError {
    public constructor(
        message: string
    ) {
        super(message, 500);
    }
}

export {
    MethodNotAvailableError,
    RouteHandlerExecutedError,
    MiddlewareExecutionError,
    UnkownRouteHandlerError,
    NoRouteHandlerError
}