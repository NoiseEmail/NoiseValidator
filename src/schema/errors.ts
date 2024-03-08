import { GenericError } from "../error/error";

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

export {
    MissingHandlerError,
    InvalidInputError
};