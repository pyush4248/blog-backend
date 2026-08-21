const errorHandler = (err, req, res, next) => {

    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

    const response = {
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || []
    };

    if (process.env.NODE_ENV === "development") {
        response.stack = err.stack;
    }

    return res.status(statusCode).json(response);
    
};

export default errorHandler;

// errorHandler middleware ka detail me explanation with how internally code is working => errorHandler ek middleware function hai jo Express.js me use hota hai. Ye function 4 parameters leta hai: err, req, res, aur next.

// Jab bhi koi error throw hoti hai ya next() function ko error ke saath call kiya jata hai, ye middleware execute hota hai. Ye middleware error object ko receive karta hai aur uske properties ko use karke ek response create karta hai.

// Sabse pehle, ye check karta hai ki res.statusCode 200 ke barabar nahi hai. Agar nahi hai to usko statusCode variable me store karta hai, warna 500 (Internal Server Error) ko default status code ke roop me set karta hai.

// Fir, ye ek response object create karta hai jisme success property false hoti hai, message property me error ka message hota hai (agar available ho to), aur errors property me error ke additional details hote hai (agar available ho to).