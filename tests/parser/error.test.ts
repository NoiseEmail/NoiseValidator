import { describe, expect, test } from '@jest/globals';
import { headers } from '../../src/parser/headers';
import ParserError from '../../src/parser/error';

describe('ParserError', () => {
    test('ParserError', () => {
        const error = new ParserError(
            ['test'],
            'Test error',
            (input, rejection) => input,
            'test',
            {
                type: 'custom',
                value: 'test',
                valid: false,
                optional: false
            }
        );

        expect(error).toBeInstanceOf(ParserError);
        expect(error.to_string()).toBe('ParserError: Test error at test: test');
        expect(error.path).toStrictEqual(['test']);
        expect(error.message).toBe('Test error');
        expect(error.parameter).toBeInstanceOf(Function);
        expect(error.input).toBe('test');
        expect(error.details).toStrictEqual({
            type: 'custom',
            value: 'test',
            valid: false,
            optional: false
        });
    });
});