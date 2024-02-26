import { describe, expect, test } from '@jest/globals';
import { headers } from '../../src/parser/headers';
import { RouterTypes } from '../../src/router/types';
import ParserError from '../../src/parser/error';

// -- Singular values
describe('Headers', () => {
    test('Headers (Valid)', () => {
        const parsed = headers({ 'test': 'test' }, { 'test': true });
    
        expect(parsed).not.toBeInstanceOf(ParserError);
        expect(parsed).toBeNull();
    });
    
    
    
    test('Headers (Invalid)', () => {
        const parsed = headers({ }, { 'test': true });
    
        expect(parsed).toBeInstanceOf(ParserError);
        expect(parsed).not.toBeNull();
        if (!(parsed instanceof ParserError)) return;
        expect(parsed.message).toBe('Header is missing');
    });
    
    
    
    test('Headers (Optional)', () => {
        const parsed = headers({ }, { 'test': false });
        expect(parsed).not.toBeInstanceOf(ParserError);
        expect(parsed).toBeNull();
    });
    
    
    
    test('Headers (Optional, Provided)', () => {
        const parsed = headers({ 'test': 'test' }, { 'test': false });
    
        expect(parsed).not.toBeInstanceOf(ParserError);
        expect(parsed).toBeNull();
    });
    
    
    
    // -- Multiple values
    test('Headers (Multiple, Valid)', () => {
        const parsed = headers(
            { 'test': 'test', 'test2': 'test2' }, 
            { 'test': true, 'test2': true });
    
        expect(parsed).not.toBeInstanceOf(ParserError);
        expect(parsed).toBeNull();
    });
    
    
    
    test('Headers (Multiple, Invalid)', () => {
        const parsed = headers(
            { 'test': 'test' }, 
            { 'test': true, 'test2': true });
    
        expect(parsed).toBeInstanceOf(ParserError);
        expect(parsed).not.toBeNull();
        if (!(parsed instanceof ParserError)) return;
        expect(parsed.message).toBe('Header is missing');
    });
    
    
    
    test('Headers (Multiple, Optional)', () => {
        const parsed = headers(
            { 'test': 'test' }, 
            { 'test': true, 'test2': false });
    
        expect(parsed).not.toBeInstanceOf(ParserError);
        expect(parsed).toBeNull();
    });
    
    
    
    test('Headers (Multiple, Optional, Provided)', () => {
        const parsed = headers(
            { 'test': 'test', 'test2': 'test2' }, 
            { 'test': true, 'test2': false });
    
        expect(parsed).not.toBeInstanceOf(ParserError);
        expect(parsed).toBeNull();
    });
    
    
    
    test('Headers (Multiple, Optional, Provided, Missing)', () => {
        const parsed = headers(
            { 'test2': 'test2' }, 
            { 'test': true, 'test2': false });
    
        expect(parsed).toBeInstanceOf(ParserError);
        expect(parsed).not.toBeNull();
        if (!(parsed instanceof ParserError)) return;
        expect(parsed.message).toBe('Header is missing');
    });
    
    
    
    test('Headers (Multiple, Optional, Missing)', () => {
        const parsed = headers(
            { }, 
            { 'test': false, 'test2': false });
    
        expect(parsed).not.toBeInstanceOf(ParserError);
        expect(parsed).toBeNull();
    });
});