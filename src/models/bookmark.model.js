import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        blog: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Blog",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate bookmarks
bookmarkSchema.index(
    {
        user: 1,
        blog: 1
    },
    {
        unique: true
    }
);

const Bookmark = mongoose.model(
    "Bookmark",
    bookmarkSchema
);

export default Bookmark;