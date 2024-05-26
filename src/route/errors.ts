import { GenericError } from '@error';

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
}

export {
    MethodNotAvailableError,
    NoRouteHandlerError
}