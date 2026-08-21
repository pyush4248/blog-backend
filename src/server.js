import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/database.js";



connectDB()
    .then(() => {

        const server = app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });

       server.on("error", (error) => {
            console.log("ServerOn error:", error);
        });

    })
    .catch((error) => {
        console.error("Failed to start server:", error);
    });