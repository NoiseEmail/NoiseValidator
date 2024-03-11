import { GenericError } from '../error/error';

class MissingHandlerError extends GenericError {
    public constructor(
        message: string,
    ) {
        super(message, 500);
    }
};

class InvalidInputError extends GenericError {
    public constructor(
        message: string,
    ) {
        super(message, 400);
    }
};

class SchemaExecutionError extends GenericError {
    public constructor(
        message: string,
    ) {
        super(message, 500);
    }
};

class SchemaMissingFieldError extends GenericError {
    public constructor(
        path: Array<string>
    ) {
        super(`Missing field at path: [${path.join(' => ')}]`, 400);
    }
};

export {
    SchemaMissingFieldError,
    SchemaExecutionError,
    MissingHandlerError,
    InvalidInputError
};