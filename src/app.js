// app.js ki responsibility ye hai ki wo server ko start kare aur database se connection banaye. Ye file sirf ek kaam karegi. Aur kuch nahi.
// Express app banana
// Middlewares register karna
// Routes register karna
// Error middleware register karna
//Ye kabhi bhi app.listen() nahi karega.

import cors from "cors";
import helmet from "helmet"

import { apiRateLimiter } from "./middlewares/rateLimit.middleware.js";
import cookieParser from "cookie-parser";
import express from "express";
import errorHandler from "./middlewares/errorHandler.middleware.js";
import bookmarkRoutes from "./routes/bookmark.routes.js";

import userRoutes from "./routes/user.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import blogRoutes from "./routes/blog.routes.js";

const app = express();

app.use(helmet());

app.use(express.json());// Ye middleware body ko parse karega aur req.body me store karega. Ye sirf json data ke liye kaam karega. Agar koi aur data parse karna hai to hume alag se middleware use karna padega

app.use(cookieParser());// Ye middleware cookies ko parse karega aur req.cookies me store karega. Ye middleware sirf cookies ke liye kaam karega. Agar koi aur data parse karna hai to hume alag se middleware use karna padega

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
);


app.use("/api/v1/users", userRoutes);

app.use("/api/v1/blogs", apiRateLimiter, blogRoutes);

app.use("/api/v1/comments", apiRateLimiter, commentRoutes);

app.use("/api/v1/bookmarks",apiRateLimiter, bookmarkRoutes);

app.use(errorHandler);

export default app;