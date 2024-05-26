export type ServerConfiguration = {
    port: number;
    debug: boolean;
    host: string;
};

export type OptionalServerConfiguration = Partial<ServerConfiguration>;