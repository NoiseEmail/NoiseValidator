import { describe, expect, test } from '@jest/globals';
import { String, Number, Schema } from 'noise_validator';



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

    test('Should execute handler function and call valid callback on success', async () => {
        const schema = new Schema.Body({ test: String });
        const input = { test: 'test' };

        const result = await schema.validate(input);
        expect(result.type).toEqual('data');
        expect(result.data).toEqual(input);
    });

    test('Should execute handler function and call valid callback on success', async () => {
        const schema = new Schema.Body({ test: { test: String } });
        const input = { test: { test: 'test' } };

        const result = await schema.validate(input);
        expect(result.type).toEqual('data');
        expect(result.data).toEqual(input);
    });

    // -- very very nested object with multiple branches
    test('Super nested object with multiple branches, pass', async () => {
        const schema = new Schema.Body({
            b1: {
                b2: {
                    b3: {
                        b4: {
                            b5: String
                        }
                    },
                    b6: {
                        b7: {
                            b8: {
                                b9: String
                            }
                        }
                    }
                },
                b6: {
                    b7: {
                        b8: {
                            b9: String
                        }
                    }
                }
            }
        });

        const input = {
            b1: {
                b2: {
                    b3: {
                        b4: {
                            b5: 'test'
                        }
                    },
                    b6: {
                        b7: {
                            b8: {
                                b9: 'test'
                            }
                        }
                    }
                },
                b6: {
                    b7: {
                        b8: {
                            b9: 'test'
                        }
                    }
                }
            }
        };

        const result = await schema.validate(input);
        expect(result.type).toEqual('data');
        expect(result.data).toEqual(input);
    });

    test('Super nested object with multiple branches, fail', async () => {
        const schema = new Schema.Body({
            b1: {
                b2: {
                    b3: {
                        b4: {
                            b5: String
                        }
                    },
                    b6: {
                        b7: {
                            b8: {
                                b9: String
                            }
                        }
                    }
                },
                b6: {
                    b7: {
                        b8: {
                            b9: Number
                        }
                    }
                }
            }
        });

        const input = {
            b1: {
                b2: {
                    b3: {
                        b4: {
                            b5: 'test'
                        }
                    },
                    b6: {
                        b7: {
                            b8: {
                                b9: 'test'
                            }
                        }
                    }
                },
                b6: {
                    b7: {
                        b8: {
                            b9: 'test'
                        }
                    }
                }
            }
        };

        const result = await schema.validate(input);
        expect(result.type).toEqual('error');
        expect(result.error.message).toEqual('Invalid number');
    });

    test('Should execute handler function and call invalid callback on failure', async () => {
        const schema = new Schema.Body({ test: Number });
        const input = { test: 'TEST' };

        const result = await schema.validate(input);
        expect(result.type).toEqual('error');
        expect(result.error.message).toEqual('Invalid number');
    });

    test('Should execute handler function and call invalid callback on failure', async () => {
        const schema = new Schema.Body({ test: { test: Number } });
        const input = { test: { test: 'TEST' } };

        const result = await schema.validate(input);
        expect(result.type).toEqual('error');
        expect(result.error.message).toEqual('Invalid number');
    });

    test('Should maintain log stack during execution', async () => {
        const schema = new Schema.Body({ test: Number });
        const input = { test: 'TEST' };

        expect(schema.log_stack.length).toBe(0);
        await schema.validate(input);
        expect(schema.log_stack.length).toBeGreaterThan(0);
    });

    test('Should correctly handle null input value in constructor', async () => {
        const schema = new Schema.Body({ test: Number });
        const input = null;

        const result = await schema.validate(input);
        expect(result.type).toEqual('error');
        expect(result.error.message).toEqual('Value not provided');
    });
});
  