// Ye file sirf ek kaam karegi.

// MongoDB se connection banana.

// Aur kuch nahi.

import mongoose from "mongoose";

// dotenv.config();

const connectDB = async () => {

    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);

        //connectionInstance ek object return karega jisme connection ke details honge. Hum uske connection property ko access kar rahe hai aur uske host ko log kar rahe hai. Details like ki kaunsa host se connection banaya gaya hai.

        console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
    }
    catch (error) {
        console.log(`Error: ${error.message}`);

        process.exit(1); // Ye line process ko exit kar degi agar connection me error aata hai. Iska matlab hai ki agar database se connection nahi ban paata to application ko band kar diya jayega.
    }

}

export default connectDB;

