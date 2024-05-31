import { GenericError } from 'noise_validator/src/error';



class MiddlewareGenericError extends GenericError {
    public constructor(
        message: string,
    ) {
        super(message, 500);
    }
};

class MissingMiddlewareHandlerError extends GenericError {
    public constructor(
        message: string,
    ) {
        super(message, 500);
    }
};

class MiddlewareValidationError extends GenericError {
    public constructor(
        message: string,
    ) {
        super(message, 500);
    }
};



export {
    MiddlewareGenericError,
    MissingMiddlewareHandlerError,
    MiddlewareValidationError
};