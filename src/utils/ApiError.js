// Custom error class to handle API errors 

// ye Error class ka use karenge jab bhi hume API me koi error throw karna ho. Ye class Error class ko extend karta hai aur additional properties add karta hai jaise statusCode, success, aur errors.

class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong", errors = []) {
        super(message);

        this.statusCode = statusCode;
        this.success = false;
        this.errors = errors;

        Error.captureStackTrace(this, this.constructor);
    }
}

export default ApiError;