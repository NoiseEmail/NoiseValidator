export namespace GenericError {

    export class GenericErrorLike extends Error {
        protected readonly _id: string;
        protected readonly _message: string;
        protected readonly _code: number;
        protected readonly _type: string;
        public serialize: () => string;
    }

}