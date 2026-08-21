import { Router } from "express";

import {
    addBookmark,
    removeBookmark,
    getMyBookmarks
} from "../controllers/bookmark.controller.js";

import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
    "/:blogId",
    verifyJWT,
    addBookmark
);

router.delete(
    "/:blogId",
    verifyJWT,
    removeBookmark
);

router.get(
    "/",
    verifyJWT,
    getMyBookmarks
);

export default router;