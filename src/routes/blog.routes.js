import { Router } from "express";
import { createBlog, getAllBlogs, getBlogById, updateBlog, deleteBlog, getMyBlogs, getBlogByCategory } from "../controllers/blog.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/", verifyJWT, upload.single("coverImage"), createBlog);

router.get("/", getAllBlogs);

router.get("/my-blogs", verifyJWT, getMyBlogs);

router.patch("/:blogId", verifyJWT, upload.single ("coverImage"), updateBlog);

router.get("/:blogId", getBlogById);

router.delete( "/:blogId", verifyJWT, deleteBlog );

router.get("/blog/:category", getBlogByCategory)

export default router;