import Comment from "../models/comment.model.js";
import Blog from "../models/blog.model.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createComment = asyncHandler(async (req, res) => {

    const {
        blog,
        content
    } = req.body;

    if (!blog) {
        throw new ApiError(
            400,
            "Blog ID is required"
        );
    }

    if (!content || !content.trim()) {
        throw new ApiError(
            400,
            "Comment content is required"
        );
    }

    const blogExists = await Blog.findById(blog);

    if (!blogExists) {
        throw new ApiError(
            404,
            "Blog not found"
        );
    }

    const comment = new Comment({
        blog,
        author: req.user._id,
        content: content.trim()
    });

    await comment.save();

    // Increment comment count
    await Blog.findByIdAndUpdate(
        blog,
        {
            $inc: {
                commentCount: 1
            }
        }
    );

    return res.status(201).json(
        new ApiResponse(
            201,
            comment,
            "Comment created successfully"
        )
    );
});

const getBlogComments = asyncHandler(async (req, res) => {

    const { blogId } = req.params;

    if (!mongoose.isValidObjectId(blogId)) {
        throw new ApiError(
            400,
            "Invalid blog ID"
        );
    }

    const blogExists = await Blog.findById(blogId);

    if (!blogExists) {
        throw new ApiError(
            404,
            "Blog not found"
        );
    }

    // Pagination
    const pageNumber = Math.max(
        parseInt(req.query.page) || 1,
        1
    );

    const limit = Math.min(
        Math.max(
            parseInt(req.query.limit) || 10,
            1
        ),
        50
    );

    const skip = (pageNumber - 1) * limit;

    // Total comments
    const totalComments = await Comment.countDocuments({
        blog: blogId
    });

    const totalPages = Math.ceil(
        totalComments / limit
    );

    // Fetch comments
    const comments = await Comment.find({
        blog: blogId
    })
        .populate(
            "author",
            "username firstName lastName"
        )
        .sort({
            createdAt: -1
        })
        .skip(skip)
        .limit(limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                pagination: {
                    totalComments,
                    totalPages,
                    currentPage: pageNumber,
                    limit,
                    hasNextPage:
                        pageNumber < totalPages,
                    hasPreviousPage:
                        pageNumber > 1
                }
            },
            "Comments fetched successfully"
        )
    );
});

const updateComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(
            400,
            "Invalid comment ID"
        );
    }

    if (!content || !content.trim()) {
        throw new ApiError(
            400,
            "Comment content is required"
        );
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(
            404,
            "Comment not found"
        );
    }

    // Authorization
    if (
        comment.author.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You are not authorized to update this comment"
        );
    }

    comment.content = content.trim();

    await comment.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            comment,
            "Comment updated successfully"
        )
    );
});

const deleteComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(
            400,
            "Invalid comment ID"
        );
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(
            404,
            "Comment not found"
        );
    }

    // Authorization
    if (
        comment.author.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You are not authorized to delete this comment"
        );
    }

    const blogId = comment.blog;

    await comment.deleteOne();

    // Decrement comment count
    await Blog.findByIdAndUpdate(
        blogId,
        {
            $inc: {
                commentCount: -1
            }
        }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Comment deleted successfully"
        )
    );
});

export {
    createComment,
    getBlogComments,
    updateComment,
    deleteComment
};