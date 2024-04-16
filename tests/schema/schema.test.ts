import { describe, expect, test } from '@jest/globals';
import { 
    execute,
    GenericType,
    MissingHandlerError,
    InvalidInputError,
    Boolean,
    String,
    Number,
    Uuid,
    GenericError,
    Schema,
    SchemaExecutionError,
    SchemaMissingFieldError,
} from 'noise_validator';



describe('Schema Class', () => {
    describe('Initialization', () => {
        test('Body', () => {
            const body = new Schema.Body({ test: String });
            expect(body._type).toBe('body');
        });

        test('Query', () => {
            const query = new Schema.Query({ test: String });
            expect(query._type).toBe('query');
        });

        test('Headers', () => {
            const headers = new Schema.Headers({ test: String });
            expect(headers._type).toBe('headers');
        });

        test('Cookies', () => {
            const cookies = new Schema.Cookies({ test: String });
            expect(cookies._type).toBe('cookies');
        });
    });
  
    describe('Validation', () => {
        test('Should validate input data against schema', async () => {
            // Test validate method with different input data
            // Assert validation result matches expected outcome
        });
    });
  
    describe('Error Handling', () => {
        test('Should handle missing fields error', async () => {
            // Test missing field error handling
            // Assert error is thrown with correct message and data
        });
    
        // Repeat for other types of errors
    });
  
    describe('Log Stack', () => {
        test('Should maintain log stack during validation', async () => {
            // Test log stack behavior during validation
            // Assert log stack is correctly maintained
        });
    });
});
  