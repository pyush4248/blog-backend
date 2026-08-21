import multer from "multer";
import path from "path";

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, "./public/temp");

    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            path.extname(file.originalname);

        cb(null, uniqueName);

    }

});

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const fileFilter = function (req, file, cb) {

    if (allowedMimeTypes.includes(file.mimetype)) {

        cb(null, true);

    } else {

        cb(
            new Error(
                "Only JPG, PNG and WEBP images are allowed"
            ),
            false
        );

    }
};



const upload = multer({

    storage,

    fileFilter,

    limits: {

        fileSize:
            5 * 1024 * 1024

    }

});

export default upload;