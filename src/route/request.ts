import { BinderNamespace, BinderOutputValidatorResult, Cookie } from 'noise_validator/src/binder/types';
import { FastifyReply, FastifyRequest } from 'fastify';
import { GenericError } from 'noise_validator/src/error';
import { create_set_cookie_header, Log } from '..';
import { RouteHandlerExecutedError, MiddlewareExecutionError } from './errors';
import { MiddlewareNamespace } from 'noise_validator/src/middleware/types';
import { v4 } from 'uuid';
import { Execute } from 'noise_validator/src/middleware';



type ValidatedDataType = 
    (BinderNamespace.GenericCallbackObject & { success: true }) & 
    {
        on_success_cookies: Map<string, Cookie.Shape>,
        on_success_headers: Map<string, string>,
        on_failure_cookies: Map<string, Cookie.Shape>,
        on_failure_headers: Map<string, string>,
        on_both_cookies: Map<string, Cookie.Shape>,
        on_both_headers: Map<string, string>,
        binder_set_cookies: Map<string, Cookie.Shape>,
        data: Record<string, { success: boolean, data: unknown }>,
    };



class RequestProcessor {
    private readonly _id: string = v4();
    private _errors: Array<GenericError> = [];

    private readonly _fastify_request: FastifyRequest;
    private readonly _fastify_reply: FastifyReply;
    private readonly _binder: BinderNamespace.MapObject;
    private readonly _before_middleware: MiddlewareNamespace.MiddlewareObject;
    private readonly _after_middleware: MiddlewareNamespace.MiddlewareObject;

    private _on_success_cookies: Map<string, Cookie.Shape> = new Map();
    private _on_success_headers: Map<string, string> = new Map();
    private _on_failure_cookies: Map<string, Cookie.Shape> = new Map();
    private _on_failure_headers: Map<string, string> = new Map();
    private _on_both_cookies: Map<string, Cookie.Shape> = new Map();
    private _on_both_headers: Map<string, string> = new Map();
    private _binder_set_cookies: Map<string, Cookie.Shape> = new Map();

    private _flags = {
        reply_sent: false,
        validate_failed: false,
        callback_errored: false,
        after_middleware_errored: false,
    };


    public constructor(
        fastify_request: FastifyRequest, 
        fastify_reply: FastifyReply,
        binder: BinderNamespace.MapObject
    ) {
        this._fastify_request = fastify_request;
        this._fastify_reply = fastify_reply;
        this._binder = binder;
        this._before_middleware = binder.before_middleware;
        this._after_middleware = binder.after_middleware;
    }



    /**
     * @name execute
     * @description Executes the request processor
     */
    public execute = async (): Promise<void> => {
        let validated_data : ValidatedDataType | Error;
        let callback_result: BinderOutputValidatorResult | Error;


        
        // -- Execute THE BEFORE middleware and the callback, the before middleware
        //    can crash and therefore disallow the callback from being executed.
        try {
            validated_data = await this.execute_validater();
            callback_result = await this.execute_callback(validated_data);
        }

        catch (unknown_error) {
            const error = GenericError.from_unknown(unknown_error);
            callback_result = error;
            validated_data = error;
        }



        // -- Execute the AFTER middleware
        try {
            await this.execute_after_middleware();

            // -- We throw here as we want to ensure that the after middleware gets executed
            if (
                !callback_result || callback_result instanceof Error ||
                !validated_data || validated_data instanceof Error
            ) throw callback_result;

            // -- Success
            this._fastify_reply.headers(Object.fromEntries(this._on_both_headers));
            this._fastify_reply.headers(Object.fromEntries(this._on_success_headers));
            const cookies = new Map([...this._on_both_cookies, ...this._on_success_cookies, ...this._binder_set_cookies]);
            if (cookies.size > 0) this._fastify_reply.header('Set-Cookie', create_set_cookie_header(cookies));
            return this._fastify_reply.send(callback_result.body);
        }

        catch (unknown_error) {
            return this.send_exception();
        }
    }



    /**
     * Executes the validation process for the input data
     * and BEFORE middleware execution
     */
    public execute_validater = async (): Promise<ValidatedDataType> => {
        
        // -- Execute the binder
        const validater_result = await this._binder.validate(
            this._fastify_request, 
            this._fastify_reply, 
            this._before_middleware
        ).catch(unknown_error => { 
            const error = GenericError.from_unknown(unknown_error);
            this._errors.push(error);
            throw error; 
        });

        // -- Set the cookies and headers
        this._on_success_cookies = validater_result.on_success_cookies;
        this._on_success_headers = validater_result.on_success_headers;
        this._on_failure_cookies = validater_result.on_failure_cookies;
        this._on_failure_headers = validater_result.on_failure_headers;
        this._on_both_cookies = validater_result.on_both_cookies;
        this._on_both_headers = validater_result.on_both_headers;
        this._binder_set_cookies = validater_result.binder_set_cookies;

        // -- Check if the after middleware errored
        if (validater_result.success === false) {
            this._flags.validate_failed = true;
            this._parse_middleware_response(validater_result.data);
            throw new MiddlewareExecutionError('The "execute_validater" did not execute successfully');
        }

        else return validater_result;
    };



    /**
     * Executes the binder callback
     */
    public execute_callback = async (
        validated_data: BinderNamespace.ValidateDataReturn
    ): Promise<BinderOutputValidatorResult | GenericError> => {
        try { 
            if (validated_data.success === false) throw new MiddlewareExecutionError('The data was not validated successfully');
            const data = await this._binder.callback(validated_data);
            if (data instanceof Error) throw data;
            return data;
        }
        
        catch (unknown_error) { 
            const error = GenericError.from_unknown(unknown_error);
            this._flags.callback_errored = true;
            this._errors.push(error);
            return error;
        };
    };



    /**
     * Executes the AFTER middleware
     */
    public execute_after_middleware = async (): Promise<void> => {
        // -- Execute the after middleware
        const after_middleware = await Execute.many(this._after_middleware, {
            request: this._fastify_request,
            reply: this._fastify_reply,
        }).catch(unknown_error => { 
            const error = GenericError.from_unknown(unknown_error);
            this._errors.push(error);
            throw error; 
        });

        // -- Set the cookies and headers 
        this._on_success_cookies = new Map([...this._on_success_cookies, ...after_middleware.on_success_cookies]);
        this._on_success_headers = new Map([...this._on_success_headers, ...after_middleware.on_success_headers]);
        this._on_failure_cookies = new Map([...this._on_failure_cookies, ...after_middleware.on_failure_cookies]);
        this._on_failure_headers = new Map([...this._on_failure_headers, ...after_middleware.on_failure_headers]);
        this._on_both_cookies = new Map([...this._on_both_cookies, ...after_middleware.on_both_cookies]);
        this._on_both_headers = new Map([...this._on_both_headers, ...after_middleware.on_both_headers]);

        // -- Check if the after middleware errored
        if (after_middleware.overall_success === false) {
            this._parse_middleware_response(after_middleware.data);
            this._flags.after_middleware_errored = true;
            throw new MiddlewareExecutionError('The "execute_after_middleware" did not execute successfully');
        };
    };



    private _parse_middleware_response = (
        middleware_result: Record<string, { success: boolean, data: unknown }>
    ) => Object.keys(middleware_result).forEach((middleware_key) => {
        const middleware = middleware_result[middleware_key];
        if (middleware.success) return;
        this._errors.push(MiddlewareExecutionError.from_unknown(middleware.data));
    });



    /**
     * @name send_exception
     * @description Sends an exception to the client, formatted as a JSON object
     * use this to send exceptions to the client, as it will be in a
     * consistent format
     * 
     * @param {FastifyReply} reply - The fastify reply object
     * @param {GenericErrorLike} error - The error to send
     * 
     * @returns {void} - Nothing
     */
    public send_exception = (): void => {

        // -- Check if the reply was sent
        if (this._flags.reply_sent) throw new RouteHandlerExecutedError('The route handler has already been executed');
        this._flags.reply_sent = true;

        // -- Get the latest error
        if (this._errors.length < 1) this._errors.push(new GenericError('An unknown error occurred', 500));
        const latest = this._errors[this._errors.length - 1];
        this._errors.pop();        

        // -- Set the error headers and cookies
        this._fastify_reply.headers(Object.fromEntries(this._on_both_headers));
        this._fastify_reply.headers(Object.fromEntries(this._on_failure_headers));
        const cookies = new Map([...this._on_both_cookies, ...this._on_failure_cookies]);
        if (cookies.size > 0) this._fastify_reply.header('Set-Cookie', create_set_cookie_header(cookies));

        // -- Send the error
        try {
            this._fastify_reply.code(latest.code).send({
                message: latest.message,
                id: latest.id,
                data: latest.data,
                hint: latest.hint,
                type: latest.type,
                errors: this._errors.map(e => e.serialize()),
                code: latest.code,
                flags: this._flags,
            });
        }

        catch (unknown_error) {
            Log.error('!!!!!!! IMPORTANT !!!!!!!');
            Log.error(unknown_error);
            Log.error('An unknown error occurred while sending an error to the client');
            Log.error('This is a critical error, please investigate');
            Log.error('!!!!!!! IMPORTANT !!!!!!!');
        };
    };



    public get id(): string { return this._id; }
    public get errors(): Array<GenericError> { return this._errors; }
    public get flags(): Record<string, boolean> { return this._flags; }
}


export default RequestProcessor;