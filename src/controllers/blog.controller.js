import asyncHandler from "../utils/asyncHandler.js";
import Comment from "../models/comment.model.js";
import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import fs from 'fs'
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import Blog from "../models/blog.model.js"

const createBlog = asyncHandler(async (req, res) => {

    let uploadedCoverImage = null;

    if (req.file) {
        uploadedCoverImage = await uploadOnCloudinary(
            req.file.path
        );
    }
    if (req.file && !uploadedCoverImage) {
        throw new ApiError(
            500,
            "Failed to upload cover image"
        );
    }
    console.log("uploadCoverImage =>>> ", uploadedCoverImage);
    const {
        title,
        content,
        contentSummary,
        category,
        tags,
        status,
        visibility,
        coverImage = uploadedCoverImage
            ? {
                url: uploadedCoverImage.secure_url,
                publicId: uploadedCoverImage.public_id
            }
            : {
                url: "",
                publicId: ""
            }
    } = req.body;

    if (
        !title?.trim() ||
        !content?.trim() ||
        !contentSummary?.trim() ||
        !category?.trim()
    ) {
        throw new ApiError(
            400,
            "Title, content, contentSummary and category are required"
        );
    }

    const blog = new Blog({
        title: title.trim(),
        content: content.trim(),
        contentSummary: contentSummary.trim(),
        category: category.trim(),
        tags: tags || [],
        status: status || "draft",
        visibility: visibility || "public",
        author: req.user._id,
        coverImage
    });

    await blog.save();

    return res.status(201).json(
        new ApiResponse(
            201,
            blog,
            "Blog created successfully"
        )
    );

});

const getAllBlogs = asyncHandler(async (req, res) => {

    const {
        page = 1,
        limit = 10,
        search,
        category,
        tags,
        sort = "newest"
    } = req.query;

    const sortValue = sort.trim() || "newest";

    let sortOption = {
        createdAt: -1
    };

    if (sortValue === "oldest") {
        sortOption = {
            createdAt: 1
        };
    }

    if (sortValue === "mostViewed") {
        sortOption = {
            views: -1
        };
    }

    // Validate page
    let pageNumber = parseInt(page);

    if (isNaN(pageNumber) || pageNumber < 1) {
        pageNumber = 1;
    }

    // Validate limit
    let limitNumber = parseInt(limit);

    if (isNaN(limitNumber) || limitNumber < 1) {
        limitNumber = 10;
    }

    if (limitNumber > 50) {
        limitNumber = 50;
    }

    // Base filter
    const filter = {
        status: "published",
        visibility: "public"
    };

    //tags Filter

    if (tags?.trim()) {
        filter.tags = tags.trim().toLowerCase();
    }

    // Add category condition only when search is provided

    if (category?.trim()) {
        filter.category = category.trim();
    }

    // Add search condition only when search is provided
    if (search?.trim()) {

        filter.$or = [
            {
                title: {
                    $regex: search.trim(),
                    $options: "i"
                }
            },
            {
                contentSummary: {
                    $regex: search.trim(),
                    $options: "i"
                }
            },
            {
                category: {
                    $regex: search.trim(),
                    $options: "i"
                }
            },
            {
                tags: {
                    $regex: search.trim(),
                    $options: "i"
                }
            }
        ];
    }

    // Count blogs matching the same filter
    const totalBlogs = await Blog.countDocuments(filter);

    // Calculate total pages
    const totalPages = Math.ceil(
        totalBlogs / limitNumber
    );

    // If there are no blogs
    if (totalPages === 0) {
        pageNumber = 1;
    }

    // Check whether requested page exists
    if (
        pageNumber > totalPages &&
        totalPages > 0
    ) {
        throw new ApiError(
            404,
            "Requested page does not exist"
        );
    }

    // Calculate how many documents to skip
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch blogs
    const blogs = await Blog.find(filter)
        .populate(
            "author",
            "firstName lastName username avatar"
        )
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber);

    // Response data
    const data = {
        blogs,
        pagination: {
            currentPage: pageNumber,
            limit: limitNumber,
            totalBlogs,
            totalPages
        }
    };

    return res.status(200).json(
        new ApiResponse(
            200,
            data,
            "Blogs fetched successfully"
        )
    );
});

const getBlogById = asyncHandler(async (req, res) => {

    const { blogId } = req.params;

    if (!mongoose.isValidObjectId(blogId)) {
        throw new ApiError(
            400,
            "Invalid blog ID"
        );
    }

    const blog = await Blog.findOneAndUpdate(
        {
            _id: blogId,
            status: "published",
            visibility: "public"
        },
        {
            $inc: {
                views: 1
            }
        },
        {
            new: true
        }
    )
        .populate(
            "author",
            "firstName lastName username avatar"
        );

    if (!blog) {
        throw new ApiError(
            404,
            "Blog not found"
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            blog,
            "Blog fetched successfully"
        )
    );
});

const updateBlog = asyncHandler(async (req, res) => {

    const { blogId } = req.params;

    // Validate blog ID
    if (!mongoose.isValidObjectId(blogId)) {
        throw new ApiError(
            400,
            "Invalid blog ID"
        );
    }

    const {
        title,
        content,
        contentSummary,
        category,
        tags,
        status,
        visibility
    } = req.body;

    // Find blog
    const blog = await Blog.findById(blogId);

    if (!blog) {
        throw new ApiError(
            404,
            "Blog not found"
        );
    }

    // Authorization
    if (
        blog.author.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You are not authorized to update this blog"
        );
    }

    // Update only provided fields
    if (title !== undefined) {
        blog.title = title.trim();
    }

    if (content !== undefined) {
        blog.content = content.trim();
    }

    if (contentSummary !== undefined) {
        blog.contentSummary = contentSummary.trim();
    }

    if (category !== undefined) {
        blog.category = category.trim();
    }

    if (tags !== undefined) {
        blog.tags = tags;
    }

    if (status !== undefined) {
        blog.status = status;
    }

    if (visibility !== undefined) {
        blog.visibility = visibility;
    }

    // Store old and new image IDs
    let oldCoverImagePublicId = null;
    let newCoverImagePublicId = null;

    // Upload new cover image if provided
    if (req.file) {

        const uploadedCoverImage =
            await uploadOnCloudinary(req.file.path);

        if (!uploadedCoverImage) {
            throw new ApiError(
                500,
                "Failed to upload new cover image"
            );
        }

        // Save old image public ID
        oldCoverImagePublicId =
            blog.coverImage?.publicId || null;

        // Save new image public ID
        newCoverImagePublicId =
            uploadedCoverImage.public_id;

        // Replace cover image
        blog.coverImage = {
            url: uploadedCoverImage.secure_url,
            publicId: uploadedCoverImage.public_id
        };
    }

    // Save database changes
    try {

        await blog.save();

    } catch (error) {

        // Database update failed.
        // Delete newly uploaded Cloudinary image.
        if (newCoverImagePublicId) {

            await deleteFromCloudinary(
                newCoverImagePublicId
            );
        }

        throw error;
    }

    // Database update succeeded.
    // Now old image is no longer needed.
    if (oldCoverImagePublicId) {

        await deleteFromCloudinary(
            oldCoverImagePublicId
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            blog,
            "Blog updated successfully"
        )
    );
});

const deleteBlog = asyncHandler(async (req, res) => {

    const { blogId } = req.params;

    // Validate blog ID
    if (!mongoose.isValidObjectId(blogId)) {
        throw new ApiError(
            400,
            "Invalid blog ID"
        );
    }

    // Find blog
    const blog = await Blog.findById(blogId);

    if (!blog) {
        throw new ApiError(
            404,
            "Blog not found"
        );
    }

    // Authorization
    if (
        blog.author.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You are not authorized to delete this blog"
        );
    }

    // Store Cloudinary public ID before deleting blog
    const blogCoverImagePublicId =
        blog.coverImage?.publicId || null;

    // Delete all comments belonging to this blog
    await Comment.deleteMany({
        blog: blogId
    });

    // Delete blog from MongoDB
    await blog.deleteOne();

    // Delete cover image from Cloudinary
    if (blogCoverImagePublicId) {

        try {

            await deleteFromCloudinary(
                blogCoverImagePublicId
            );

        } catch (error) {

            console.log(
                "Unable to delete image from Cloudinary:",
                error
            );
        }
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Blog deleted successfully"
        )
    );
});

const getMyBlogs = asyncHandler(async (req, res) => {

    const {
        page = 1,
        limit = 10,
        status,
        visibility,
        sort = "newest"
    } = req.query;

    let pageNumber = parseInt(page);

    if (isNaN(pageNumber) || pageNumber < 1) {
        pageNumber = 1;
    }

    let limitNumber = parseInt(limit);

    if (isNaN(limitNumber) || limitNumber < 1) {
        limitNumber = 10;
    }

    if (limitNumber > 50) {
        limitNumber = 50;
    }

    const allowedStatuses = [
        "draft",
        "published"
    ];

    if (
        status &&
        !allowedStatuses.includes(status.trim())
    ) {
        throw new ApiError(
            400,
            "Invalid status"
        );
    }

    const allowedVisibility = [
        "public",
        "private"
    ];

    if (
        visibility &&
        !allowedVisibility.includes(visibility.trim())
    ) {
        throw new ApiError(
            400,
            "Invalid visibility"
        );
    }

    const filter = {
        author: req.user._id
    };

    if (status?.trim()) {
        filter.status = status.trim();
    }

    if (visibility?.trim()) {
        filter.visibility = visibility.trim();
    }

    const sortValue = sort.trim() || "newest";

    const allowedSorts = [
        "newest",
        "oldest",
        "mostViewed"
    ];

    if (!allowedSorts.includes(sortValue)) {
        throw new ApiError(
            400,
            "Invalid sort option"
        );
    }

    let sortOption = {
        createdAt: -1
    };

    if (sortValue === "oldest") {
        sortOption = {
            createdAt: 1
        };
    }

    if (sortValue === "mostViewed") {
        sortOption = {
            views: -1
        };
    }

    const totalBlogs = await Blog.countDocuments(filter);

    const totalPages = Math.ceil(
        totalBlogs / limitNumber
    );

    if (totalPages === 0) {
        pageNumber = 1;
    }

    if (
        pageNumber > totalPages &&
        totalPages > 0
    ) {
        throw new ApiError(
            404,
            "Requested page does not exist"
        );
    }

    const skip = (pageNumber - 1) * limitNumber;

    const blogs = await Blog.find(filter)
        .populate(
            "author",
            "firstName lastName username avatar"
        )
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber);

    const publishedCount = await Blog.countDocuments({
        author: req.user._id,
        status: "published"
    });

    const draftCount = await Blog.countDocuments({
        author: req.user._id,
        status: "draft"
    });

    const totalBlogsCount = await Blog.countDocuments({
        author: req.user._id
    });

    const viewsCount = await Blog.aggregate([
        {
            $match: {
                author: req.user._id
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" }
            }
        }
    ]);

    const totalViews = viewsCount[0]?.totalViews || 0;

    const data = {
        blogs,
        pagination: {
            currentPage: pageNumber,
            limit: limitNumber,
            totalBlogs,
            totalPages
        },
        blogData: {
            totalBlogsCount: totalBlogsCount,
            publishedCount: publishedCount,
            draftCount: draftCount,
            totalViews: totalViews
        }
    };

    return res.status(200).json(
        new ApiResponse(
            200,
            data,
            "Your blogs fetched successfully"
        )
    );
});

const getBlogByCategory = asyncHandler(async (req, res) => {

    const { category } = req.params;

    if (!category) {
        throw new ApiError(
            400,
            "Category is null - custom message"
        )
    }

    const blogsWithCategory = await Blog.find({
        category
    })

    return res.status(200).json(
        new ApiResponse(
            200,
            blogsWithCategory,
            "Blogs reurned Successfull with Category"
        ))
})

const getCategory = asyncHandler(async (req, res) => {

    const categories = await Blog.aggregate([
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                category: "$_id",
                count: 1
            }
        },
        {
            $sort: {
                category: 1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            categories,
            "Categories fetched successfully"
        )
    );
});



export {
    createBlog,
    getAllBlogs,
    getBlogById,
    updateBlog,
    deleteBlog,
    getMyBlogs,
    getCategory,
    getBlogByCategory
};