import { Schema, Optional, Uuid } from '../../schema';
import { GenericMiddleware } from '../index';


const session_body_schema = new Schema.Headers({
    session_id: Optional(Uuid)
});

export type SessionMiddlewareOutput = {
    session_id: string;
    last_active: Date;
};

export default class SessionMiddleware extends GenericMiddleware<SessionMiddlewareOutput | void> {
    
    protected handler = async () => {
        
        // const body = await this.validate_input('body', session_body_schema);
        // body.admin_id
        const test = await this.validate_input('headers', session_body_schema);


        return;
    
    }
};