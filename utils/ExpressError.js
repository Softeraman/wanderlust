class ExpressError extends Error {
    constructor(statusCode, message) {
        super(message); // Pass message to built-in Error constructor
        this.statusCode = statusCode;
         this.message = message;
    }
}

module.exports = ExpressError;
