import { Router } from "express";
import { createBlog, getAllBlogs, getBlogById, updateBlog, deleteBlog, getMyBlogs } from "../controllers/blog.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/", verifyJWT, upload.single("coverImage"), createBlog);

router.get("/", getAllBlogs);

router.get("/my-blogs", verifyJWT, getMyBlogs);

router.patch("/:blogId", verifyJWT, upload.single ("coverImage"), updateBlog);

router.get("/:blogId", getBlogById);

router.patch( "/:blogId", verifyJWT, updateBlog );

router.delete( "/:blogId", verifyJWT, deleteBlog );

export default router;