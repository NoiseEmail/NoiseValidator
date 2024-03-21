export type RouterConfiguration = {
    port: number;
    debug: boolean;
    host: string;
};

export type OptionalRouterConfiguration = Partial<RouterConfiguration>;