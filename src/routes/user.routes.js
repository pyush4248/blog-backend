import { Router } from 'express'

import {authRateLimiter, apiRateLimiter} from '../middlewares/rateLimit.middleware.js';
import { registerUser, loginUser, getCurrentUser, logoutUser, refreshAccessToken, changeCurrentPassword, updateProfile, updateAvatar } from '../controllers/user.controller.js';
import verifyJWT from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';

const router = Router();

router.post('/register', authRateLimiter, registerUser);

router.post('/login', authRateLimiter, loginUser);

router.post('/logout', apiRateLimiter, verifyJWT, logoutUser);

router.get('/current-user', apiRateLimiter, verifyJWT, getCurrentUser);

router.post("/refresh-token", apiRateLimiter, refreshAccessToken);

router.post("/change-password", apiRateLimiter, verifyJWT, changeCurrentPassword);

router.patch("/update-profile", apiRateLimiter, verifyJWT, updateProfile)

router.patch(
    "/avatar",
    verifyJWT,
    upload.single("avatar"),
    updateAvatar
);

export default router;