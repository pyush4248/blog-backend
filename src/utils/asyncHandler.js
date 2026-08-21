const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch(next);
    };
};

export default asyncHandler;

//asyncHandler ka detail me explanation with how enternally code is working => asyncHandler ek higher order function hai jo ek controller function ko argument ke roop me leta hai aur ek naya function return karta hai. Ye naya function async hota hai aur isme try-catch block ka use kiya jata hai.

// jab bhi hum controller function ko call karte hai to ye async function execute hota hai aur controller function ke andar jo bhi asynchronous code hota hai wo execute hota hai. Agar koi error throw hoti hai to ye catch block me chala jata hai aur next() function ko call karta hai jisse ki error handling middleware me error pass ho jata hai.

// promise.resolve() ka use kiya jata hai taaki agar controller function ek promise return karta hai to usko resolve kiya ja sake aur agar wo synchronous code return karta hai to usko bhi handle kiya ja sake. Isse ye ensure hota hai ki controller function ke andar jo bhi code execute hota hai wo asynchronous ho ya synchronous, dono cases me error handling sahi tarike se kaam karegi.