import { GenericError } from '@error';



class MiddlewareGenericError extends GenericError {
    public constructor(
        message: string,
    ) {
        super(message, 400);
    }
};

class MissingMiddlewareHandlerError extends GenericError {
    public constructor(
        message: string,
    ) {
        super(message, 400);
    }
};

export {
    MiddlewareGenericError,
    MissingMiddlewareHandlerError
};