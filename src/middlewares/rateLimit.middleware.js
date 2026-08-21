import rateLimit from "express-rate-limit";

const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,

    message: {
        success: false,
        message: "Too many authentication attempts. Please try again later."
    },

    standardHeaders: true,
    legacyHeaders: false
});

const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,

    message: {
        success: false,
        message: "Too many requests. Please try again later."
    },

    standardHeaders: true,
    legacyHeaders: false
});

export {
    authRateLimiter,
    apiRateLimiter
};