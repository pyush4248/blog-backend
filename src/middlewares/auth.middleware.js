import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";


// Middleware to verify JWT token
const verifyJWT = asyncHandler(async (req, res, next) => {

    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace(
            "Bearer ",
            ""
        );

    if (!token) {
        throw new ApiError(401, "Access token is missing");
    }
    // Ye jwt.verify() function token ko verify karega. Agar token valid hai to ye decoded token return karega. Agar token invalid hai to ye error throw karega. Ye function synchronous hai. Isliye humne isko try-catch block me rakha hai. Agar ye error throw karta hai to hum next() function ko call karenge jisse ki error handling middleware me error pass ho jaye.
    
    let decodedToken;

    try{
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    } catch (error){
        console.log("JWT Verification Error:", error);
        throw new ApiError(401, "Invalid or Expired access token");
    }

    console.log("Decoded Token:", decodedToken);

    if (!decodedToken || !decodedToken._id) {
        throw new ApiError(401, "Invalid access token");
    }

    const user = await User.findById(decodedToken._id);

    if (!user) {
        throw new ApiError(401, "User not found");
    }

    req.user = user;

    next();

});

export default verifyJWT;

// Suppose token ke andar payload tha.

// {
//     "_id": "68a4bc123",
//         "username": "piyush07",
//             "email": "piyush@gmail.com",
//                 "iat": 1754658000,
//                     "exp": 1754661600
// }

// Verify ke baad.

//     decodedToken

// ban jayega.

// {
//     _id: "...",
//         username: "piyush07",
//             email: "piyush@gmail.com",
//                 iat: ...,
//     exp: ...
// }