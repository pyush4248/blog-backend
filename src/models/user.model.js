import mongoose from 'mongoose';

import jwt from 'jsonwebtoken';

import bcrypt from 'bcrypt';
// ye user schema hai. Ye schema user ke data ko define karega. Jaise ki user ka name, email, password, etc. Ye schema mongoose ke Schema class ka instance hai. Ye schema ko use karke hum user model create karenge. Ye model hume database me user ke data ko store karne me help karega.

// schema => Schema ek blueprint hai jo batata hai document kaisa dikhega aur uske validation rules kya hain.
//  => User.create({
//         firstName,
//         middleName,
//         lastName,
//         username,
//         email,
//         password
//     });
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        minlength: [3, "First name must be at least 3 characters"],
        maxlength: [30, "First name cannot exceed 30 characters"]
    },
    middleName: {
        type: String,
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        minlength: [2, "Last name must be at least 2 characters"],
        maxlength: [30, "Last name cannot exceed 30 characters"]
    },
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: [true, "Username already exists"],
        lowercase: [true, "Username must be in lowercase"],
        trim: true,
        minlength: [3, "Username must be at least 3 characters"],
        maxlength: [20, "Username cannot exceed 20 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email already exists"],
        lowercase: [true, "Email must be in lowercase"],
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        select: false
    },
    avatar: {
        url: {
            type: String,
            default: ""
        },
        publicId: {
            type: String,
            default: ""
        }
    },
    refreshToken: {
        type: String,
        select: false
    }
}, {
    timestamps: true
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    const accessToken = jwt.sign({
        _id: this._id,
        username: this.username,
        email: this.email
    },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    return accessToken;
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};

userSchema.pre("save", async function () {

    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 10);

});


// First, we create a Schema, which acts as a blueprint for our User documents.It defines the fields, their data types, and validation rules.Then we create a Model using mongoose.model("User", userSchema).The Model is associated with the users collection in MongoDB, and the collection is created automatically when the first document is inserted.We export this Model and use its methods like create(), find(), findById(), updateOne(), and deleteOne() to interact with the database.Whenever a document is created or saved, Mongoose validates the data against the schema, and if the validation fails, it throws a Validation Error instead of saving invalid data.

const User = mongoose.model("User", userSchema);

export default User;