import { BinderConfiguration } from "./types";

export default {
    method: 'GET',
    middleware: {},
    schemas: {
        body: {},
        query: {},
        headers: {}
    }
} as BinderConfiguration<any, any, any, any>;