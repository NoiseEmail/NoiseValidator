import { GenericError } from 'noise_validator/src/error';


class GenericRouteError extends GenericError {
};


class MethodNotAvailableError extends GenericRouteError {
    public constructor(
        method: string
    ) {
        super(`Method ${method} is not served by this route`, 405);
    }
};

class NoRouteHandlerError extends GenericRouteError {
    public constructor(
        message: string
    ) {
        super(message, 404);
    }
};

class RouteHandlerExecutedError extends GenericRouteError {
    public constructor(
        message: string,
        code: number = 500
    ) {
        super(message, code);
    }
};

class UnkownRouteHandlerError extends GenericRouteError {
    public constructor(
        message: string
    ) {
        super(message, 500);
    }
};

class MiddlewareExecutionError extends GenericRouteError {
    public constructor(
        message: string
    ) {
        super(message, 500);
    }
}

export {
    GenericRouteError,
    MethodNotAvailableError,
    RouteHandlerExecutedError,
    MiddlewareExecutionError,
    UnkownRouteHandlerError,
    NoRouteHandlerError
}