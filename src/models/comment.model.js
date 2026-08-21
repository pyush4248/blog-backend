import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        blog: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Blog",
            required: true
        },

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        content: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 1000
        }
    },
    {
        timestamps: true
    }
);

const Comment = mongoose.model(
    "Comment",
    commentSchema
);

export default Comment;