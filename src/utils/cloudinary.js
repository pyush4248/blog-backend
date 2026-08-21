import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

console.log("entered in cloudinary file")

console.log("Cloudinary config:", {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecretExists: !!process.env.CLOUDINARY_API_SECRET
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});



const deleteFromCloudinary = async (publicId) => {

    try {

        if (!publicId) {
            return null;
        }

        const response = await cloudinary.uploader.destroy(
            publicId,
            {
                resource_type: "image"
            }
        );

        console.log(
            "Cloudinary delete response:",
            response
        );

        return response;

    } catch (error) {

        console.log(
            "Cloudinary delete failed:",
            error
        );

        return null;
    }
};

const uploadOnCloudinary = async (localFilePath) =>{
    try{
         if(!localFilePath){
            return null;
         }
         const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type: "auto"
         });
 
         fs.unlinkSync(localFilePath);

        // console.log("Response in Cloudinary.js:", response);

         return response;


    }catch(error){

        console.log("Cloudinary upload failed:", error);

        if(localFilePath) fs.unlinkSync(localFilePath)

            return null;

    }
}

export {uploadOnCloudinary,
    deleteFromCloudinary
}