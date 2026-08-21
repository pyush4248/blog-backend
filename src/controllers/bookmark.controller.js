import mongoose from "mongoose";

import Bookmark from "../models/bookmark.model.js";
import Blog from "../models/blog.model.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const addBookmark = asyncHandler(async (req, res) => {

    const { blogId } = req.params;

    if (!mongoose.isValidObjectId(blogId)) {
        throw new ApiError(
            400,
            "Invalid blog ID"
        );
    }

    const blog = await Blog.findById(blogId);

    if (!blog) {
        throw new ApiError(
            404,
            "Blog not found"
        );
    }

    const bookmark = new Bookmark({
        user: req.user._id,
        blog: blogId
    });

    try {

        await bookmark.save();

    } catch (error) {

        // Duplicate bookmark
        if (error.code === 11000) {
            throw new ApiError(
                409,
                "Blog is already bookmarked"
            );
        }

        throw error;
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            bookmark,
            "Blog bookmarked successfully"
        )
    );
});

const removeBookmark = asyncHandler(async (req, res) => {

    const { blogId } = req.params;

    if (!mongoose.isValidObjectId(blogId)) {
        throw new ApiError(
            400,
            "Invalid blog ID"
        );
    }

    const bookmark = await Bookmark.findOne({
        user: req.user._id,
        blog: blogId
    });

    if (!bookmark) {
        throw new ApiError(
            404,
            "Bookmark not found"
        );
    }

    await bookmark.deleteOne();

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Bookmark removed successfully"
        )
    );
});

const getMyBookmarks = asyncHandler(async (req, res) => {

    const bookmarks = await Bookmark.find({
        user: req.user._id
    })
        .populate(
            "blog",
            "title contentSummary coverImage category tags author visibility status createdAt"
        )
        .sort({
            createdAt: -1
        });

    return res.status(200).json(
        new ApiResponse(
            200,
            bookmarks,
            "Bookmarks fetched successfully"
        )
    );
});

export {
    addBookmark,
    removeBookmark,
    getMyBookmarks
};