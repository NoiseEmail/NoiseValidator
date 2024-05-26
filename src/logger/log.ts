import { LogType } from './types.d';
import { log_types } from './type_enum';

// -- Globa space less gooo, this is only used by the rerver
//    and is set as you start the server, it will get replaced
//    with some better config stuff, but fornow thissldo
let debug_mode: boolean = false;
export const _debug_mode = (value: boolean): boolean => debug_mode = value;
export const is_debug = (): boolean => debug_mode;



/**
 * @name log_header
 * Logs a header to the console
 * 
 * @example [INFO: 12:00:00]
 * 
 * @param {LogType} type - The type of log
 * 
 * @returns {string} The header
 */
export const log_header = (type: LogType): string => {
    const date = new Date();
    return `[${type}: ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`;
};



/**
 * @name log
 * Logs a message to the console
 * 
 * @param {LogType} type - The type of log
 * @param {Array<unknown>} args - The arguments to log
 * 
 * @returns {void} - Nothing, it just logs
 */
export const log = (type: LogType, ...args: Array<unknown>): void => {
    // -- Only log if we are in debug mode or an ERROR has occured
    // if (!LOG && type !== log_types.ERROR) return;
    const header = log_header(type);
    const concat = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');

    switch (type) {
        case log_types.INFO:
        case log_types.WARN:
        case log_types.ERROR:
            console.log(header, concat);
            break;

    case log_types.DEBUG:
        if (!_debug_mode) return;
        console.log(header, concat);
        break;

    case log_types.THROW:
        throw new Error(`${header} ${concat}`);
    }
};

export const info = (...args: Array<unknown>): void => log(log_types.INFO, ...args);
export const warn = (...args: Array<unknown>): void => log(log_types.WARN, ...args);
export const error = (...args: Array<unknown>): void => log(log_types.ERROR, ...args);
export const debug = (...args: Array<unknown>): void => log(log_types.DEBUG, ...args);
export const throw_err = (...args: Array<unknown>): void => log(log_types.THROW, ...args);

export default {
    info,
    warn,
    error,
    debug,
    throw: throw_err
};