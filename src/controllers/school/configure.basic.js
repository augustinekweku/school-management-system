import url from "url"
import cloudinaryConfig from "../../config/config.cloudinary.js"
import DatabaseConnection from "../../config/config.db.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import StringManipulators from "../../utils/algos/StringManipulators.js"
import { Messages, Regex } from "../../utils/static/index.js"
import SchoolValidators from "../../validators/validator.school.js"
import SchoolQueries from "../../queries/query.school.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"

export default function ConfigureBasicSchoolInformation() {
    const cloudinaryUploader = cloudinaryConfig()
    const { configurationValidator, logoUpdateValidator } = SchoolValidators(), { capitalize, cleanText } = StringManipulators()
    const { pool } = DatabaseConnection(), { WSWW, BRS } = Messages.General
    const { extract } = Eligibility_Extractor()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { SETINFOS, UPDATELOGO, GETSCHOOL } = SchoolQueries()
    const { MONGOOBJECT } = Regex

    const schoolInformationConfig = (req, res) => {
        let { id, school_name, country, owner, email, motto, address, logo } = req.body
        const expected_payload = ['id', 'school_name', 'country', 'owner', 'email', 'motto', 'address', 'logo']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = configurationValidator(req.body, () => {
            // owner = capitalize(owner), email = email.trim(), motto = capitalize(motto), address = capitalize(address), country = capitalize(country), school_name = capitalize(school_name)
            let photo_id = '', secure_url = ''
            const updatePhoto = async (oldPhotoId) => {
                let photoIdInstance = !oldPhotoId ? '' : oldPhotoId
                photoIdInstance.length > 0 ? await cloudinaryUploader.uploader.destroy(photoIdInstance).catch(err => console.warn(err)) : null
                await cloudinaryUploader.uploader.upload(logo, { folder: 'iSchool/school_logos' }, (err, done) => {
                    if (!err) {
                        photo_id = done.public_id
                        secure_url = done.secure_url
                    }
                })
                return { photo_id, secure_url }
            }
            return extract(id, req, res, async () => {
                const data = req.school_data
                const logoUpload = logo.length === 0 ? null : await updatePhoto(data.logo_id)
                if (photo_id.length === 0 && data.name === school_name &&
                    data.owner === owner &&
                    data.country === country &&
                    data.school_email === email &&
                    data.motto === motto &&
                    data.address === address)
                    return res.status(412).json({ message: 'No changes found yet', code: '412', data: {} })
                const photoId = !logoUpload ? data.logo_id : logoUpload.photo_id
                const secureUrl = !logoUpload ? data.logo_url : logoUpload.secure_url
                const timestamp = (new Date()).toISOString()
                pool.query(SETINFOS, [id, owner, email, motto, address, photoId, secureUrl, timestamp, school_name, country]).then(() => {
                    return res.status(200).json({
                        message: 'School information updated', code: '200',
                        data: {
                            ...data, name: school_name, country, owner, school_email: email, motto, address, logo_url: secureUrl,
                            updated_at: timestamp, logo_id: undefined, user_id: undefined, row_id: undefined
                        }
                    })
                }).catch(err => {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                })
            })
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const updateLogo = (req, res) => {
        const { id, logo } = req.body
        const expected_payload = ['id', 'logo']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = logoUpdateValidator(req.body, () => {
            const updatePhoto = async (oldPhotoId) => {
                let photo_id = '', secure_url = '', photoIdInstance = !oldPhotoId ? '' : oldPhotoId
                photoIdInstance.length > 0 ? await cloudinaryUploader.uploader.destroy(photoIdInstance).catch(err => console.warn(err)) : null
                await cloudinaryUploader.uploader.upload(logo, { folder: 'iSchool/school_logos' }, (err, done) => {
                    if (!err) {
                        photo_id = done.public_id
                        secure_url = done.secure_url
                    }
                })
                return { photo_id, secure_url }
            }
            return extract(id, req, res, async () => {
                const data = req.school_data, timestamp = (new Date()).toISOString()
                const { photo_id, secure_url } = await updatePhoto(data.logo_id)
                pool.query(UPDATELOGO, [id, photo_id, secure_url, timestamp]).then(() => {
                    return res.status(200).json({
                        message: 'School logo updated successfully', code: '200',
                        data: {
                            ...data, logo_url: secure_url, updated_at: timestamp, logo_id: undefined, user_id: undefined
                        }
                    })
                }).catch(err => {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                })
            })
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const getSchool = (req, res) => {
        const param = new URLSearchParams(url.parse(req.url, true).query)
        if (!param.get('school')) return res.status(400).json({ message: BRS, code: '400', data: {} })
        const school = param.get('school')
        if (school.length === 0) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        pool.query(GETSCHOOL, [school]).then(result => {
            return res.status(200).json({ message: '', code: '200', data: { ...result.rows[0] } })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }


    return {
        schoolInformationConfig, updateLogo, getSchool
    }
}