import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import fs from 'fs'
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (userId) => {

    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();

    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({
        validateBeforeSave: false
    });

    return {
        accessToken,
        refreshToken
    };
};

//Register user controller
const registerUser = asyncHandler(async (req, res) => {

    const {
        firstName,
        middleName,
        lastName,
        username,
        email,
        password
    } = req.body;



    if (!firstName?.trim() || !username?.trim() || !email?.trim() || !password?.trim()) {
        throw new ApiError(
            400,
            "All required fields are mandatory"
        );
    }

    // Check email
    const emailExists = await User.findOne({ email });

    if (emailExists) {
        throw new ApiError(409, "Email is already registered");
    }

    // Check username
    const usernameExists = await User.findOne({ username });

    if (usernameExists) {
        throw new ApiError(409, "Username is already taken");
    }
    // Create user
    const user = await User.create({
        firstName,
        middleName,
        lastName,
        username,
        email,
        password
    });

    console.log("User created:", user);

    res.status(201).json(new ApiResponse(
        201,
        "User registered successfully",
        user
    ));

});

//Login user controller
const loginUser = asyncHandler(async (req, res) => {
    //Destructuring the login credentials from the request body
    const { login, password } = req.body;

    if (!login?.trim() || !password?.trim()) {
        throw new ApiError(400, "All required fields are mandatory");
    }

    //Finding the user by email or username

    const user = await User.findOne({
        $or: [
            { email: login.toLowerCase() },
            { username: login.toLowerCase() }
        ]
    }).select("+password");

    if (!user) {
        throw new ApiError(401, "Invalid login credentials");
    }
    //Checking if the provided password matches the stored password
    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid login credentials");
    }
    //Generating access and refresh tokens for the authenticated user
    // const accessToken = user.generateAccessToken();
    // const refreshToken = user.generateRefreshToken();

    // user.refreshToken = refreshToken;

    // //Saving the refresh token in the database
    // await user.save({
    //     validateBeforeSave: false
    // })

    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    //geting the user data without password and refresh token to send in response
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // cookie options
    const options = {
        httpOnly: true,
        secure: true
    }

    //Sending the response with access token, refresh token and user data
    res.status(200).cookie("refreshToken", refreshToken, options).cookie("accessToken", accessToken, options).json(new ApiResponse(
        200, {
        user: loggedInUser
    },
        "User logged in successfully"
    ));
})

const getCurrentUser = asyncHandler(async (req, res) => {

    return res.status(200).json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully"
        )
    );

});

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(userId,
        {
            $unset: {
                refreshToken: 1
            }
        })

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("refreshToken", options).
        clearCookie("accessToken", options).
        json(new ApiResponse(
            200,
            {},
            "User logged out successfully"
        ));

})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is missing");
    }

    let decodedRefreshToken;

    try {

        decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    } catch (error) {
        throw new ApiError(401, "Invalid refresh token" + error.message);
    }

    if (!decodedRefreshToken || !decodedRefreshToken._id) {
        throw new ApiError(401, "Invalid refresh token or Id is missing");
    }

    const user = await User.findById(decodedRefreshToken._id).select("+refreshToken");


    if (!user || !user.refreshToken) {
        throw new ApiError(401, "Refresh token is invalid or user not found");
    }

    const isrefreshTokenValid = user.refreshToken === incomingRefreshToken;

    if (!isrefreshTokenValid) {
        throw new ApiError(401, "Refresh token is invalid");
    }
    //generate new Tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    // Cookie options
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    // Send new cookies
    return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {},
                "Access token refreshed successfully"
            )
        );

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    // Destructuring the current and new passwords from the request body
    const { currentPassword, newPassword } = req.body;


    if (currentPassword === newPassword) {
        throw new ApiError(
            400,
            "New password must be different from old password"
        );
    }

    if (
        !oldPassword?.trim() ||
        !newPassword?.trim()
    ) {
        throw new ApiError(
            400,
            "Old password and new password are required"
        );
    }

    // Finding the user by ID and selecting the password field
    const user = await User.findById(req.user._id)
        .select("+password");

    const isCurrentPasswordCorrect = await user.isPasswordCorrect(currentPassword);

    if (!isCurrentPasswordCorrect) {
        throw new ApiError(
            401,
            "Old password is incorrect"
        );
    }

    user.password = newPassword;

    await user.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully"
            )
        );
});

const updateProfile = asyncHandler(async (req, res) => {

    const {
        firstName,
        middleName,
        lastName,
        username,
        email
    } = req.body;

    // At least one field should be provided
    if (
        firstName === undefined &&
        middleName === undefined &&
        lastName === undefined &&
        username === undefined &&
        email === undefined
    ) {
        throw new ApiError(
            400,
            "At least one field is required to update"
        );
    }

    // Validate first name
    if (firstName !== undefined) {
        if (!firstName.trim()) {
            throw new ApiError(
                400,
                "First name cannot be empty"
            );
        }

        if (firstName.trim().length < 3) {
            throw new ApiError(
                400,
                "First name must be at least 3 characters"
            );
        }
    }

    // Validate middle name (optional)
    if (middleName !== undefined) {
        if (
            middleName.trim() &&
            middleName.trim().length < 3
        ) {
            throw new ApiError(
                400,
                "Middle name must be at least 3 characters"
            );
        }
    }

    // Validate last name
    if (lastName !== undefined) {
        if (!lastName.trim()) {
            throw new ApiError(
                400,
                "Last name cannot be empty"
            );
        }

        if (lastName.trim().length < 3) {
            throw new ApiError(
                400,
                "Last name must be at least 3 characters"
            );
        }
    }

    // Validate username
    if (username !== undefined) {

        if (!username.trim()) {
            throw new ApiError(
                400,
                "Username cannot be empty"
            );
        }

        if (username.trim().length < 3) {
            throw new ApiError(
                400,
                "Username must be at least 3 characters"
            );
        }

        const usernameExists = await User.findOne({
            username: username.toLowerCase(),
            _id: {
                $ne: req.user._id
            }
        });

        if (usernameExists) {
            throw new ApiError(
                409,
                "Username already exists"
            );
        }

    }

    // Validate email
    if (email !== undefined) {

        if (!email.trim()) {
            throw new ApiError(
                400,
                "Email cannot be empty"
            );
        }

        const emailExists = await User.findOne({
            email: email.toLowerCase(),
            _id: {
                $ne: req.user._id
            }
        });

        if (emailExists) {
            throw new ApiError(
                409,
                "Email already exists"
            );
        }

    }

    // Prepare update object
    const updateData = {};

    if (firstName !== undefined) {
        updateData.firstName = firstName.trim();
    }

    if (middleName !== undefined) {
        updateData.middleName = middleName.trim();
    }

    if (lastName !== undefined) {
        updateData.lastName = lastName.trim();
    }

    if (username !== undefined) {
        updateData.username = username.trim().toLowerCase();
    }

    if (email !== undefined) {
        updateData.email = email.trim().toLowerCase();
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: updateData
        },
        {
            new: true,
            runValidators: true
        }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedUser,
            "Profile updated successfully"
        )
    );

});

const updateAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "Avatar Image is Required")
    }

    const avatarFilePath = req.file.path;

    const avatar = uploadOnCloudinary(avatarFilePath);

    if (!avatar) {
        throw new ApiError(500,
            "Avatar upload failed")
    }

    const updatedUser =
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    avatar: {
                        url: avatar.secure_url,
                        publicId: avatar.public_id
                    }
                }
            },
            {
                new: true
            }
        ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                "Avatar updated successfully"
            )
        );

})

export {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateProfile,
    updateAvatar
};    
