import cloudinaryConfig from "../config/config.cloudinary.js"

export default function PhotoUploader() {
    const cloudinaryUploader = cloudinaryConfig()
    const ImageStorage = async (lastId, passport, folder) => {
        let photoIdInstance = !lastId ? '' : lastId
        let photo_id = '', secure_url = ''
        photoIdInstance.length > 0 ? await cloudinaryUploader.uploader.destroy(photoIdInstance).catch(err => console.warn(err)) : null
        await cloudinaryUploader.uploader.upload(passport, { folder: `iSchool/${folder}` }, (err, done) => {
            if (!err) {
                photo_id = done.public_id
                secure_url = done.secure_url
            }
        })
        return { photo_id, secure_url }
    }
    const ImageDestroy = async (ID) => {
        let photoIdInstance = !ID ? '' : ID
        photoIdInstance.length > 0 ? await cloudinaryUploader.uploader.destroy(photoIdInstance).catch(err => console.warn(err)) : null
        return photoIdInstance
    }
    return {
        ImageStorage, ImageDestroy
    }
}