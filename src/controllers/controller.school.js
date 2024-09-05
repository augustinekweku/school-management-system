import { ObjectId } from "bson"
import cloudinaryConfig from "../config/config.cloudinary.js"
import DatabaseConnection from "../config/config.db.js"
import SchoolQueries from "../queries/query.school.js"
import StringManipulators from "../utils/algos/StringManipulators.js"
import { Messages, Regex } from "../utils/static/index.js"
import SchoolValidators from "../validators/validator.school.js"
import url from "url"
import Pagination from "../helpers/helper.pagination_setter.js"
import format from "pg-format"
import Eligibility_Extractor from "../helpers/helper.account_sch_relation.js"

export default function SchoolControllers() {
    const cloudinaryUploader = cloudinaryConfig()
    const { configurationValidator, logoUpdateValidator,
        classesValidator, classUpdateValidator, validateTermRegistration,
        academicYearRegistrationValidation } = SchoolValidators(), { capitalize, cleanText } = StringManipulators()
    const { pool } = DatabaseConnection(), { WSWW, BRS } = Messages.General
    const { extract } = Eligibility_Extractor()
    const {
        SETINFOS, UPDATELOGO, GETSCHOOL, UPDATESCHINFO, GETCLASSESBYSCHOOL, GETCLASSWITHUSER_ID,
        UPDATECLASSDATA, DELETECLASS, DELETECLASSESBYSCH_ID, GETTERMSBYSCHOOL, SAVEYEAR, GETALLSCHOOLS,
        GETACADEMIC_YEARS, GETAYEAR, PAGINATED_ACADEMIC_YEARS, UPDATEACADEMIC_YEAR, DELETEACADEMIC_YEAR
    } = SchoolQueries()
    const { MONGOOBJECT } = Regex

    const getSchools = (req, res) => {
        pool.query(GETALLSCHOOLS).then(results => {
            return res.status(200).json({ message: '', code: '200', data: { schools: results.rows } })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }
    // const schoolInformationConfig = (req, res) => {
    //     let { id, school_name, country, owner, email, motto, address, logo } = req.body
    //     const validate = configurationValidator(req.body, () => {
    //         owner = capitalize(owner), email = email.trim(), motto = capitalize(motto), address = capitalize(address), country = capitalize(country), school_name = capitalize(school_name)
    //         let photo_id = '', secure_url = ''
    //         const updatePhoto = async (oldPhotoId) => {
    //             let photoIdInstance = !oldPhotoId ? '' : oldPhotoId
    //             photoIdInstance.length > 0 ? await cloudinaryUploader.uploader.destroy(photoIdInstance).catch(err => console.warn(err)) : null
    //             await cloudinaryUploader.uploader.upload(logo, { folder: 'iSchool/school_logos' }, (err, done) => {
    //                 if (!err) {
    //                     photo_id = done.public_id
    //                     secure_url = done.secure_url
    //                 }
    //             })
    //             return { photo_id, secure_url }
    //         }
    //         return extract(id, req, res, async () => {
    //             const data = req.school_data
    //             const logoUpload = logo.length === 0 ? null : await updatePhoto(data.logo_id)
    //             if (photo_id.length === 0 && data.name === school_name &&
    //                 data.owner === owner &&
    //                 data.country === country &&
    //                 data.school_email === email &&
    //                 data.motto === motto &&
    //                 data.address === address)
    //                 return res.status(412).json({ message: 'No changes found yet', code: '412', data: {} })
    //             const photoId = !logoUpload ? data.logo_id : logoUpload.photo_id
    //             const secureUrl = !logoUpload ? data.logo_url : logoUpload.secure_url
    //             const timestamp = (new Date()).toISOString()
    //             pool.query(SETINFOS, [id, owner, email, motto, address, photoId, secureUrl, timestamp, school_name, country]).then(() => {
    //                 return res.status(200).json({
    //                     message: 'School information updated', code: '200',
    //                     data: {
    //                         ...data, name: school_name, country, owner, school_email: email, motto, address, logo_url: secureUrl,
    //                         updated_at: timestamp, logo_id: undefined, user_id: undefined, row_id: undefined
    //                     }
    //                 })
    //             }).catch(err => {
    //                 return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //             })
    //         })
    //     })
    //     if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
    //     return validate
    // }
    // const updateLogo = (req, res) => {
    //     const { id, logo } = req.body
    //     const validate = logoUpdateValidator(req.body, () => {
    //         const updatePhoto = async (oldPhotoId) => {
    //             let photo_id = '', secure_url = '', photoIdInstance = !oldPhotoId ? '' : oldPhotoId
    //             photoIdInstance.length > 0 ? await cloudinaryUploader.uploader.destroy(photoIdInstance).catch(err => console.warn(err)) : null
    //             await cloudinaryUploader.uploader.upload(logo, { folder: 'iSchool/school_logos' }, (err, done) => {
    //                 if (!err) {
    //                     photo_id = done.public_id
    //                     secure_url = done.secure_url
    //                 }
    //             })
    //             return { photo_id, secure_url }
    //         }
    //         return extract(id, req, res, async () => {
    //             const data = req.school_data, timestamp = (new Date()).toISOString()
    //             const { photo_id, secure_url } = await updatePhoto(data.logo_id)
    //             pool.query(UPDATELOGO, [id, photo_id, secure_url, timestamp]).then(() => {
    //                 return res.status(200).json({
    //                     message: 'School logo updated successfully', code: '200',
    //                     data: {
    //                         ...data, logo_url: secure_url, updated_at: timestamp, logo_id: undefined, user_id: undefined
    //                     }
    //                 })
    //             }).catch(err => {
    //                 return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //             })
    //         })
    //     })
    //     if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
    //     return validate
    // }
    // const getSchool = (req, res) => {
    //     const param = new URLSearchParams(url.parse(req.url, true).query)
    //     if (!param.get('school')) return res.status(400).json({ message: BRS, code: '400', data: {} })
    //     const school = param.get('school')
    //     if (school.length === 0) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
    //     pool.query(GETSCHOOL, [school]).then(result => {
    //         return res.status(200).json({ message: '', code: '200', data: { ...result.rows[0] } })
    //     }).catch(err => {
    //         return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //     })
    // }
    // const registerClasses = (classArray, school_id, res) => {
    //     let data = []
    //     for (let i = 0; i < classArray.length; i++) {
    //         const item = classArray[i]
    //         data = [...data, [
    //             (new ObjectId()).toString(), school_id, item.class_name, item.class_shortname, (new Date()).toISOString(), (new Date()).toISOString()
    //         ]]
    //     }
    //     const stmt = format('INSERT INTO classes (id, school_id, classname, shortname, created_at, updated_at) VALUES %L', data)
    //     pool.query(stmt).then(() => {
    //         return res.status(200).json({ message: 'Class data registered successfully', code: '200', data: {} })
    //     }).catch(err => {
    //         console.log(err);
    //         return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //     })
    // }
    // const configureClasses = (req, res) => {
    //     const { classes, school_id } = req.body
    //     const validate = classesValidator(req.body, () => {
    //         return extract(school_id, req, res, () => {
    //             let newlist = []
    //             for (let i = 0; i < classes.length; i++) {
    //                 const item = classes[i]
    //                 newlist = [...newlist, { class_name: capitalize(item.class_name), class_shortname: item.class_shortname.toUpperCase() }]
    //             }
    //             pool.query(GETCLASSESBYSCHOOL, [school_id]).then(result => {
    //                 if (result.rowCount === 0) return registerClasses(newlist, school_id, res)
    //                 const dataToBeRegistered = newlist.filter(item => !result.rows.some(obj => (obj.classname === item.class_name || obj.shortname === item.class_shortname)))
    //                 if (dataToBeRegistered.length === 0) return res.status(412).json({ message: 'Classes already registered for the school', code: '412', data: {} })
    //                 return registerClasses(dataToBeRegistered, school_id, res)
    //             }).catch(err => {
    //                 return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //             })
    //         })
    //     })
    //     if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
    //     return validate
    // }
    // const fetchClasses = (req, res) => {
    //     const param = new URLSearchParams(url.parse(req.url, true).query)
    //     if (!param.get('school')) return res.status(400).json({ message: BRS, code: '400', data: {} })
    //     const school = param.get('school')
    //     if (!school.toString().match(MONGOOBJECT)) return res.status(400).json({ message: BRS, code: '400', data: {} })
    //     pool.query(GETCLASSWITHUSER_ID, [school]).then(result => {
    //         if (result.rowCount === 0) return res.status(404).json({
    //             message: 'No records found', code: '404', data: {}
    //         })
    //         let newlist = []
    //         for (let i = 0; i < result.rows.length; i++) {
    //             const class_item = result.rows[i]
    //             newlist = [...newlist, { ...class_item, user_id: undefined, school_id: undefined, row_id: undefined }]
    //         }
    //         return res.status(200).json({
    //             message: '', code: '200', data: {
    //                 school_id: school, classes: [...newlist]
    //             }
    //         })
    //     }).catch(err => {
    //         return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //     })
    // }
    // const updateClass = (req, res) => {
    //     let { school_id, class_id, class_name, class_shortname } = req.body
    //     const validate = classUpdateValidator(req.body, () => {
    //         return extract(school_id, req, res, () => {
    //             pool.query(GETCLASSWITHUSER_ID, [school_id]).then(result => {
    //                 if (result.rowCount === 0) return res.status(404).json({
    //                     message: 'No records found', code: '404', data: {}
    //                 })
    //                 class_name = capitalize(class_name), class_shortname = class_shortname.toUpperCase()
    //                 const classArray = result.rows
    //                 const data = classArray.filter(item => item.id === class_id.trim())
    //                 if (data.length === 0) return res.status(404).json({ message: 'No records found', code: '404', data })
    //                 const otherClasses = classArray.filter(item => item.id !== class_id.trim())
    //                 const update = () => {
    //                     pool.query(UPDATECLASSDATA, [class_name, class_shortname, (new Date()).toISOString(), class_id]).then(() => {
    //                         return res.status(200).json({
    //                             message: 'Class update was successful', code: '200', data: {
    //                                 school_id: class_id.trim(),
    //                                 class_data: {
    //                                     ...data[0], user_id: undefined, school_id: undefined,
    //                                     classname: class_name, shortname: class_shortname
    //                                 }
    //                             }
    //                         })
    //                     }).catch(err => {
    //                         return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //                     })
    //                 }
    //                 if (otherClasses.length === 0) return update()
    //                 const dataExistenceList = otherClasses.filter(item => (
    //                     item.classname === item.shortname || item.shortname === class_shortname
    //                 ))
    //                 if (dataExistenceList.length > 0) return res.status(412).json({
    //                     message: 'Class data already exists', code: '412', data: {}
    //                 })
    //                 return update()
    //             }).catch(err => {
    //                 return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //             })
    //         })
    //     })
    //     if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
    //     return validate
    // }
    // const deleteClass = (req, res) => {
    //     const param = new URLSearchParams(url.parse(req.url, true).query)
    //     if (!param.get('class_id') || !param.get('school_id')) return res.status(400).json({ message: BRS, code: '400', data: {} })
    //     const class_id = param.get('class_id'), school_id = param.get('school_id')
    //     if (!class_id.toString().match(MONGOOBJECT) ||
    //         !school_id.toString().match(MONGOOBJECT)
    //     ) return res.status(400).json({ message: BRS, code: '400', data: {} })
    //     return extract(school_id, req, res, () => {
    //         pool.query(DELETECLASS, [class_id, school_id]).then(() => {
    //             return res.status(200).json({ message: 'Class data removed successfully', code: '200', data: {} })
    //         }).catch(err => {
    //             return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //         })
    //     })
    // }
    // const clearAllClassesInSchool = (req, res) => {
    //     const param = new URLSearchParams(url.parse(req.url, true).query)
    //     if (!param.get('school_id')) return res.status(400).json({ message: BRS, code: '400', data: {} })
    //     const school_id = param.get('school_id')
    //     if (!school_id.toString().match(MONGOOBJECT)) return res.status(400).json({ message: BRS, code: '400', data: {} })
    //     return extract(school_id, req, res, () => {
    //         pool.query(DELETECLASSESBYSCH_ID, [school_id]).then(() => {
    //             return res.status(200).json({ message: 'All classes removed from the school', code: '200', data: {} })
    //         }).catch(err => {
    //             return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //         })
    //     })
    // }
    // const searchClasses = (req, res) => {
    //     const params = new URLSearchParams(url.parse(req.url, true).query)
    //     if (!params.get('q') || !params.get('school_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
    //     const q = cleanText(params.get('q')).toLowerCase(), school_id = params.get('school_id')
    //     if (!school_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
    //     pool.query(GETCLASSWITHUSER_ID, [school_id]).then(classes => {
    //         if (classes.rowCount === 0) return res.status(404).json({ message: 'No matching records found', code: '404', data: {} })
    //         const data = classes.rows
    //         let newlist = []
    //         for (let i = 0; i < data.length; i++) {
    //             const class_item = data[i]
    //             newlist = [...newlist, { ...class_item, user_id: undefined, school_id: undefined, row_id: undefined }]
    //         }
    //         const results = newlist.filter(item => JSON.stringify({ name: item.classname, shortname: item.shortname }).toLowerCase().includes(q))
    //         console.log(results);
    //         return res.status(200).json({
    //             message: '', code: '200', data: {
    //                 search_results: results
    //             }
    //         })
    //     }).catch(err => {
    //         return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //     })
    // }


    /* Academic year Crud */

    // const registerAcademicYear = (req, res) => {
    //     let { school_id, acad_year } = req.body
    //     const validate = academicYearRegistrationValidation(req.body, () => {
    //         return extract(school_id, req, res, () => {
    //             const yearParts = acad_year.split('-', 2)
    //             acad_year = `${parseInt(yearParts[0])}-${parseInt(yearParts[1])}`
    //             const yr_id = (new ObjectId()).toString(), timestamp = (new Date()).toISOString()
    //             const saveYear = () => {
    //                 pool.query(SAVEYEAR, [yr_id, school_id, acad_year, timestamp]).then(() => {
    //                     return res.status(201).json({
    //                         message: 'Academic year created successfully', code: '201', data: {
    //                             id: yr_id, school_id, acad_year, created_at: timestamp, updated_at: timestamp
    //                         }
    //                     })
    //                 }).catch(err => {
    //                     return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //                 })
    //             }
    //             pool.query(GETACADEMIC_YEARS, [school_id]).then(years => {
    //                 if (years.rowCount === 0) return saveYear()
    //                 const yrData = years.rows
    //                 let dataExists = false
    //                 for (let i = 0; i < yrData.length; i++) {
    //                     const item = yrData[i]
    //                     if (item.acad_year === acad_year) dataExists = true
    //                 }
    //                 if (dataExists) return res.status(412).json({
    //                     message: 'Academic year already registered', code: '412', data: {}
    //                 })
    //                 return saveYear()
    //             })
    //         })
    //     })
    //     if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
    //     return validate
    // }
    // const getAcademicYearsBySchool = (req, res) => {
    //     const params = new URLSearchParams(url.parse(req.url, true).query)
    //     if (!params.get('school_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
    //     const school_id = params.get('school_id')
    //     if (!school_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
    //     const { pageSize, offset } = Pagination().Setter(params, 1, 10)
    //     pool.query(PAGINATED_ACADEMIC_YEARS, [school_id, pageSize, offset]).then(years => {
    //         return res.status(200).json({ message: '', code: '200', data: { years: years.rows } })
    //     }).catch(err => {
    //         return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //     })
    // }
    // const getAnAcademicYear = (req, res) => {
    //     const param = new URLSearchParams(url.parse(req.url, true).query)
    //     if (!param.get('academic_year_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
    //     const year_id = param.get('academic_year_id')
    //     if (!year_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
    //     pool.query(GETAYEAR, [year_id]).then(year => {
    //         if (year.rowCount !== 1) return res.status(404).json({ message: 'No records found', code: '404', data: {} })
    //         return res.status(200).json({ ...year.rows[0] })
    //     }).catch(err => {
    //         return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //     })
    // }
    // const removeAcademicYear = (req, res) => {
    //     const param = new URLSearchParams(url.parse(req.url, true).query)
    //     if (!param.get('academic_year_id') || !param.get('school_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
    //     const year_id = param.get('academic_year_id'), school_id = param.get('school_id')
    //     if (!year_id.match(MONGOOBJECT) ||
    //         !school_id.match(MONGOOBJECT)
    //     ) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
    //     return extract(school_id, req, res, () => {
    //         pool.query(DELETEACADEMIC_YEAR, [year_id]).then(done => {
    //             if (done.rowCount > 0) return res.status(200).json({ message: 'Record deleted successfully with all associated terms', code: '200', data: {} })
    //             return res.status(412).json({ message: 'Action failed', code: '412', data: {} })
    //         }).catch(err => {
    //             return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //         })
    //     })
    // }
    // const removeAllAcademicYearsBySchool = (req, res) => {

    // }
    // const updateAcademicYear = (req, res) => {
    //     let { acad_year_id, school_id, acad_year } = req.body
    //     if (!acad_year_id.toString().match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request received', code: '400', data: {} })
    //     const validate = academicYearRegistrationValidation(req.body, () => {
    //         return extract(school_id, req, res, () => {
    //             const yearParts = acad_year.split('-', 2), timestamp = (new Date()).toISOString()
    //             acad_year = `${parseInt(yearParts[0])}-${parseInt(yearParts[1])}`
    //             pool.query(GETACADEMIC_YEARS, [school_id]).then(years => {
    //                 if (years.rowCount === 0) return res.status(404).json({ message: 'No academic year record found', code: '404', data: {} })
    //                 const yrData = years.rows, checkRow = yrData.filter(item => item.id === acad_year_id)
    //                 if (checkRow.length !== 1) return res.status(404).json({ message: 'No records found', code: '404', data: {} })
    //                 let dataExists = false, noChangesFound = false
    //                 for (let i = 0; i < yrData.length; i++) {
    //                     const item = yrData[i]
    //                     if (item.acad_year === acad_year && item.id !== acad_year_id) dataExists = true
    //                     if (item.acad_year === acad_year && item.id === acad_year_id) noChangesFound = true
    //                 }
    //                 if (dataExists) return res.status(412).json({ message: 'Cannot update the targetted year with an already registered one', code: '412', data: {} })
    //                 if (noChangesFound) return res.status(412).json({ message: 'No changes found yet', code: '412', data: {} })
    //                 pool.query(UPDATEACADEMIC_YEAR, [acad_year, timestamp, acad_year_id]).then(() => {
    //                     return res.status(200).json({
    //                         message: 'Academic year update was successful', code: '200', data: {
    //                             ...checkRow[0], row_id: undefined, acad_year, updated_at: timestamp
    //                         }
    //                     })
    //                 }).catch(err => {
    //                     return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //                 })
    //             }).catch(err => {
    //                 return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //             })
    //         })
    //     })
    //     if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
    //     return validate
    // }
    // const searchAcademicYear = (req, res) => {
    //     const params = new URLSearchParams(url.parse(req.url, true).query)
    //     if (!params.get('q') || !params.get('school_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
    //     const q = cleanText(params.get('q')), school_id = params.get('school_id')
    //     if (!school_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
    //     const { pageSize, offset } = Pagination().Setter(params, 1, 10)
    //     pool.query(PAGINATED_ACADEMIC_YEARS, [school_id, pageSize, offset]).then(years => {
    //         if (years.rowCount === 0) return res.status(404).json({ message: 'No matching records found', code: '404', data: {} })
    //         const yrData = years.rows
    //         const lowercaseQ = q.toLowerCase()
    //         const results = yrData.filter(item => JSON.stringify(item.acad_year).toLowerCase().includes(lowercaseQ))
    //         if (results.length === 0) return res.status(404).json({ message: 'No matching records found', code: '404', data: {} })
    //         return res.status(200).json({ message: '', code: '200', data: { search_results: results } })
    //     }).catch(err => {
    //         return res.status(500).json({ message: WSWW, code: '500', data: {} })
    //     })
    // }


    /* Terms Crud */

    // const saveTerms = (req, res) => {
    //     const { year_id, term_name, start_date, end_date } = req.body
    //     const validate = validateTermRegistration(req.body, () => {

    //     })
    //     if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
    //     return validate
    // }

    return {
        getSchools
    }
}