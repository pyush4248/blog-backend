import { Router } from 'express'

import {authRateLimiter, apiRateLimiter} from '../middlewares/rateLimit.middleware.js';
import { registerUser, loginUser, getCurrentUser, logoutUser, refreshAccessToken, changeCurrentPassword, updateProfile, updateAvatar, isLoggedIn } from '../controllers/user.controller.js';
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

router.get("/isLoggedIn", verifyJWT, isLoggedIn)

router.patch("/avatar", verifyJWT, updateAvatar);

export default router;