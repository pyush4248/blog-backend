import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 150
        },

        content: {
            type: String,
            required: true,
            trim: true
        },

        contentSummary: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300
        },

        coverImage: {
            url: {
                type: String,
                default: ""
            },
            publicId: {
                type: String,
                default: ""
            }
        },

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        tags: [
            {
                type: String,
                trim: true,
                lowercase: true
            }
        ],

        status: {
            type: String,
            enum: ["draft", "published"],
            default: "draft"
        },

        visibility: {
            type: String,
            enum: ["public", "private"],
            default: "public"
        },

        views: {
            type: Number,
            default: 0
        },
        commentCount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

blogSchema.index({
    author: 1
});

blogSchema.index({
    category: 1
});

blogSchema.index({
    createdAt: -1
});

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;