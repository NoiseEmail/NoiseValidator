export type ServerConfiguration = {
    port: number;
    debug: boolean;
    host: string;
    https: { 
        key: string, 
        cert: string 
    },
};

export type OptionalServerConfiguration = Partial<ServerConfiguration>;