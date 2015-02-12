class APIError implements Error {
    message: string;
    name: string;
    code: string;

    constructor(message, code?, name?) {
        this.message = message;
        this.code = code ? code : undefined;
        this.name = name ? name : undefined;
    }
}

export = APIError;