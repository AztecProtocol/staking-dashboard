export declare enum HttpMethod {
    Get = "get",
    Post = "post",
    Delete = "delete"
}
export interface HttpRequest {
    url: string;
    method: HttpMethod;
    body?: any;
}
export declare function sendRequest<T>({ url, method, body }: HttpRequest, apiKey?: string): Promise<T>;
//# sourceMappingURL=httpRequests.d.ts.map