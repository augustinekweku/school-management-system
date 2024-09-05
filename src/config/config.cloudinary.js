import cloudinary from 'cloudinary'
import dotenv from 'dotenv'
dotenv.config()
const cloudinaryV2 = cloudinary.v2
export default function cloudinaryConfig() {
    cloudinaryV2.config({
        cloud_name: process.env.SMS_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.SMS_CLOUDINARY_API_KEY,
        api_secret: process.env.SMS_CLOUDINARY_API_SECRET,
    })
    return cloudinaryV2
}