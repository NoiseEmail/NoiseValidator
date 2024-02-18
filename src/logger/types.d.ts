/**
 * @module log
 * This module contains functions for logging (Just the same as console.log) but it allows
 * us to disable logging in production, save logs etc etc.
 */

export type LogType =
    'INFO' |
    'WARN' |
    'ERROR' |
    'DEBUG';

export type LogEnum = {
    INFO: LogType;
    WARN: LogType;
    ERROR: LogType;
    DEBUG: LogType;
};