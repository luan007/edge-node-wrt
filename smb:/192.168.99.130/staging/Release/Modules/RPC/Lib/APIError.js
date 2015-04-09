var APIError = (function () {
    function APIError(message, code, name) {
        this.message = message;
        this.code = code ? code : undefined;
        this.name = name ? name : undefined;
    }
    return APIError;
})();
module.exports = APIError;
