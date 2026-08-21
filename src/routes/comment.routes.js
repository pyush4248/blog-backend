import { Router } from "express";

import {
    createComment,
    getBlogComments,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js";

import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.post( "/", verifyJWT, createComment);

router.get("/blog/:blogId", getBlogComments);

router.patch("/:commentId",verifyJWT, updateComment);

router.delete("/:commentId", verifyJWT, deleteComment);

export default router;