import { describe, expect, test } from '@jest/globals';
import { 
    execute,
    GenericType,
    Schema,
    MissingHandlerError,
    InvalidInputError,
    Boolean,
    String,
    Number,
    Uuid,
    GenericError
} from 'noise_validator';

describe('Generic type', () => {

    
    test('Basic Type that always returns true (Direct Return)', async () => {

        class TestType extends GenericType<any> {
            protected handler = () => true;
        }

        expect((await execute(TestType, 'test')).result).toBe(true);
        expect((await execute(TestType, 1)).result).toBe(true);
        expect((await execute(TestType, false)).result).toBe(true);
        expect((await execute(TestType, null)).result).toBe(true);
        expect((await execute(TestType, undefined)).result).toBe(true);
        expect((await execute(TestType, new Error())).result).toBe(true);
    });



    test('(ASYNC) Basic Type that always returns true (Direct Return)', async () => {

        class TestType extends GenericType<any> {
            protected handler = () => new Promise((resolve) => resolve(true));
        }

        expect((await execute(TestType, 'test')).result).toBe(true);
        expect((await execute(TestType, 1)).result).toBe(true);
        expect((await execute(TestType, false)).result).toBe(true);
        expect((await execute(TestType, null)).result).toBe(true);
        expect((await execute(TestType, undefined)).result).toBe(true);
        expect((await execute(TestType, new Error())).result).toBe(true);
    });



    test('Basic Type that always returns an error (Direct Return)', async () => {
            
        class TestType extends GenericType<any> {
            protected handler = () => new InvalidInputError('Test error');
        }

        expect((await execute(TestType, 'test')).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, 1)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, false)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, null)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, undefined)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, new Error())).result).toBeInstanceOf(GenericError);

        const data = (await execute(TestType, 'test')).result as GenericError;
        expect(data.message).toBe('Test error');
    });



    test('(ASYNC) Basic Type that always returns an error (Direct Return)', async () => {
            
        class TestType extends GenericType<any> {
            protected handler = () => new Promise((resolve) => resolve(new InvalidInputError('Test error')));
        }

        expect((await execute(TestType, 'test')).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, 1)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, false)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, null)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, undefined)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, new Error())).result).toBeInstanceOf(GenericError);

        const data = (await execute(TestType, 'test')).result as GenericError;
        expect(data.message).toBe('Test error');
    });



    test('Basic Type that always returns true (Implicit Return)', async () => {

        class TestType extends GenericType<any> {
            protected handler = () => {
                this.valid(true);
            };
        }

        expect((await execute(TestType, 'test')).result).toBe(true);
        expect((await execute(TestType, 1)).result).toBe(true);
        expect((await execute(TestType, false)).result).toBe(true);
        expect((await execute(TestType, null)).result).toBe(true);
        expect((await execute(TestType, undefined)).result).toBe(true);
        expect((await execute(TestType, new Error())).result).toBe(true);
    });



    test('(ASYNC) Basic Type that always returns true (Implicit Return)', async () => {

        class TestType extends GenericType<any> {
            protected handler = () => new Promise((resolve) => { 
                resolve(this.valid(true));
            });
        }

        expect((await execute(TestType, 'test')).result).toBe(true);
        expect((await execute(TestType, 1)).result).toBe(true);
        expect((await execute(TestType, false)).result).toBe(true);
        expect((await execute(TestType, null)).result).toBe(true);
        expect((await execute(TestType, undefined)).result).toBe(true);
        expect((await execute(TestType, new Error())).result).toBe(true);
    });



    test('Basic Type that always returns an error (Implicit Class Return)', async () => {
            
        class TestType extends GenericType<any> {
            protected handler = () => {
                this.invalid(new InvalidInputError('Test error'));
            }
        }

        expect((await execute(TestType, 'test')).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, 1)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, false)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, null)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, undefined)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, new Error())).result).toBeInstanceOf(GenericError);

        const data = (await execute(TestType, 'test')).result as GenericError;
        expect(data.message).toBe('Test error');
    });



    test('(ASYNC) Basic Type that always returns an error (Implicit Class Return)', async () => {
            
        class TestType extends GenericType<any> {
            protected handler = () => new Promise((resolve) => {
                this.invalid(new InvalidInputError('Test error'));
                resolve(new InvalidInputError('Test error'));
            });
        }

        expect((await execute(TestType, 'test')).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, 1)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, false)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, null)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, undefined)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, new Error())).result).toBeInstanceOf(GenericError);

        const data = (await execute(TestType, 'test')).result as GenericError;
        expect(data.message).toBe('Test error');
    });
    


    test('Basic Type that always returns an error (Implicit String Return)', async () => {
            
        class TestType extends GenericType<any> {
            protected handler = () => {
                this.invalid('Test error1');
            }
        }

        expect((await execute(TestType, 'test')).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, 1)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, false)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, null)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, undefined)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, new Error())).result).toBeInstanceOf(GenericError);

        const data = (await execute(TestType, 'test')).result as GenericError;
        expect(data.message).toBe('Test error1');
    });



    test('(ASYNC) Basic Type that always returns an error (Implicit String Return)', async () => {
            
        class TestType extends GenericType<any> {
            protected handler = () => new Promise((resolve) => {
                this.invalid('Test error');
                resolve('Test error');
            });
        }

        expect((await execute(TestType, 'test')).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, 1)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, false)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, null)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, undefined)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, new Error())).result).toBeInstanceOf(GenericError);

        const data = (await execute(TestType, 'test')).result as GenericError;
        expect(data.message).toBe('Test error');
    });



    test('Positive and Negative', async () => {
        
        // -- This should return the first method called, all other 
        //    calls should be ignored
        class TestType extends GenericType<any> {
            protected handler = () => {
                this.valid(true);
                this.invalid('Test error');
            }
        }


        expect((await execute(TestType, 'test')).result).toBe(true);
        expect((await execute(TestType, 1)).result).toBe(true);
        expect((await execute(TestType, false)).result).toBe(true);
        expect((await execute(TestType, null)).result).toBe(true);
        expect((await execute(TestType, undefined)).result).toBe(true);
        expect((await execute(TestType, new Error())).result).toBe(true);
    });



    test('(ASYNC) Positive and Negative', async () => {
        
        // -- This should return the first method called, all other 
        //    calls should be ignored
        class TestType extends GenericType<any> {
            protected handler = () => new Promise((resolve) => {
                this.valid(true);
                this.invalid('Test error');
                resolve(null);
            });
        }


        expect((await execute(TestType, 'test')).result).toBe(true);
        expect((await execute(TestType, 1)).result).toBe(true);
        expect((await execute(TestType, false)).result).toBe(true);
        expect((await execute(TestType, null)).result).toBe(true);
        expect((await execute(TestType, undefined)).result).toBe(true);
        expect((await execute(TestType, new Error())).result).toBe(true);
    });



    test('Negative and Positive', async () => {
            
        // -- This should return the first method called, all other 
        //    calls should be ignored
        class TestType extends GenericType<any> {
            protected handler = () => {
                this.invalid('Test error');
                this.valid(true);
            }
        }

        expect((await execute(TestType, 'test')).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, 1)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, false)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, null)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, undefined)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, new Error())).result).toBeInstanceOf(GenericError);

        const data = (await execute(TestType, 'test')).result as GenericError;
        expect(data.message).toBe('Test error');
    });



    test('(ASYNC) Negative and Positive', async () => {
            
        // -- This should return the first method called, all other 
        //    calls should be ignored
        class TestType extends GenericType<any> {
            protected handler = () => new Promise((resolve) => {
                this.invalid('Test error');
                this.valid(true);
                resolve(null);
            });
        }

        expect((await execute(TestType, 'test')).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, 1)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, false)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, null)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, undefined)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, new Error())).result).toBeInstanceOf(GenericError);

        const data = (await execute(TestType, 'test')).result as GenericError;
        expect(data.message).toBe('Test error');
    });



    test('Positive finish after negative async', async () => {

        class TestType extends GenericType<any> {
            protected handler = async () => {

                new Promise((resolve) => setTimeout(() => {
                    this.valid(true);
                    resolve(null);
                }, 100));

                return this.invalid('Test error');
            }
        }

        expect((await execute(TestType, 'test')).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, 1)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, false)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, null)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, undefined)).result).toBeInstanceOf(GenericError);
        expect((await execute(TestType, new Error())).result).toBeInstanceOf(GenericError);

        const data = await execute(TestType, 'test');
        expect((data.result as unknown as GenericError).message).toBe('Test error');
    });



    test('Negative finish after positive async', async () => {

        class TestType extends GenericType<any> {
            protected handler = async () => {

                new Promise((resolve) => setTimeout(() => {
                    this.invalid('Test error');
                    resolve(null);
                }, 100));

                return this.valid(true);
            }
        }

        expect((await execute(TestType, 'test')).result).toBe(true);
        expect((await execute(TestType, 1)).result).toBe(true);
        expect((await execute(TestType, false)).result).toBe(true);
        expect((await execute(TestType, null)).result).toBe(true);
        expect((await execute(TestType, undefined)).result).toBe(true);
        expect((await execute(TestType, new Error())).result).toBe(true);
    });



    test('Double execution', async () => {
            
        let called = 0;
        class TestType extends GenericType<any> {
            protected handler = () => {
                called++;
                this.valid(true);
            }
        }

        const instance = new TestType('test', () => {}, () => {});
        await instance.execute();
        await instance.execute();

        const message = 'This instance has already been executed';
        const logs = instance.log_stack;
        let found = false;

        // @ts-ignore
        logs.forEach((log) => log.args[0].includes(message) && (found = true));

        expect(found).toBe(true);
        expect(called).toBe(1);
    });



    test('Implicit Name', async () => {
                
        class TestType extends GenericType<any> {
            protected handler = () => this.valid(true);
        }

        expect(TestType.name).toBe('TestType');
    });



    test('Explicit Name', async () => {
                
        class TestType extends GenericType<any> {
            protected handler = () => this.valid(true);

            // @ts-ignore
            public static get name() {
                return 'ExplicitName';
            }
        }

        expect(TestType.name).toBe('ExplicitName');
    });



    test('Log functions', async () => {
                
        class TestType extends GenericType<any> {
            protected handler = () => this.valid(true);
        }

        const instance = new TestType('test', () => {}, () => {});
        instance.log.debug('Debug message');
        instance.log.error('Error message');
        instance.log.info('Info message');
        instance.log.warn('Warn message');
        instance.log.throw('Throw message');

        const logs = instance.log_stack;
        expect(logs.length).toBe(5);
        expect(logs[0].type).toBe('DEBUG');
        expect(logs[1].type).toBe('ERROR');
        expect(logs[2].type).toBe('INFO');
        expect(logs[3].type).toBe('WARN');
        expect(logs[4].type).toBe('THROW');
    });
});