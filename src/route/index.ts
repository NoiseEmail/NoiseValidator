import { randomUUID } from "crypto";
import { BinderMap } from "../binder/types";

export default class Route<
    UrlPath extends string
> {
    public readonly _url_path: UrlPath;
    public readonly _id: string = randomUUID();
    private _binder_map: BinderMap = new Map();

    private constructor(
        url_path: UrlPath
    ) {
        this._url_path = url_path;
    };


}