export namespace GenericError {

    export class GenericErrorLike extends Error {
        protected readonly _id: string;
        protected readonly _message: string;
        protected readonly _code: number;
        protected readonly _type: string;

        protected _data: object;
        public serialize: () => string;

        public set data(data: object)
        public get data(): object;
        
        public get id(): string;
        public get message(): string;
        public get code(): number;
        public get type(): string;
    }

}