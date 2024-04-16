import { describe, expect, test } from '@jest/globals';
import { 
    Log,
} from 'noise_validator';

describe('Logger', () => {

    test('Log.warn', () => {
        Log.warn('This is a warning');
    });

    test('Log.debug', () => {
        Log.debug('This is a debug message');
    });

    test('Log.info', () => {
        Log.info('This is an info message');
    });

    test('Log.error', () => {
        Log.error('This is an error message');
    });

    test('Log.throw', () => {
        try { 
            Log.throw_err('This is a throw message'); 
            expect(true).toBe(false);
        }
        catch (e) {}
    });

});