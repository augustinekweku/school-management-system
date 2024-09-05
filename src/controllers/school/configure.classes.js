import url from "url"
import format from "pg-format"
import { ObjectId } from "bson"
import DatabaseConnection from "../../config/config.db.js"
import SchoolQueries from "../../queries/query.school.js"
import StringManipulators from "../../utils/algos/StringManipulators.js"
import { Messages, Regex } from "../../utils/static/index.js"
import SchoolValidators from "../../validators/validator.school.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import Pagination from "../../helpers/helper.pagination_setter.js"
import PaginationParams from "../../helpers/helper.paginator.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import DatabaseEngine from "../../helpers/helper.engine-db.js"

export default function ConfigureClasses() {
    const { classesValidator, classUpdateValidator } = SchoolValidators(), { capitalize, cleanText } = StringManipulators()
    const { pool } = DatabaseConnection(), { WSWW, BRS } = Messages.General
    const { localPaginator, getPageParams } = PaginationParams()
    const { extract } = Eligibility_Extractor()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { FilterSoftDeletedItems, ExecuteSoftDelete } = DatabaseEngine()
    const { GETCLASSESBYSCHOOL, GETCLASSWITHUSER_ID, UPDATECLASSDATA, DELETECLASS, DELETECLASSESBYSCH_ID, PAGINATE_CLASSES, CHECK_CLASS } = SchoolQueries()
    const { MONGOOBJECT } = Regex

    const registerClasses = (classArray, school_id, res) => {
        let data = []
        for (let i = 0; i < classArray.length; i++) {
            const item = classArray[i]
            data = [...data, [
                (new ObjectId()).toString(), school_id, item.class_name, item.class_shortname, (new Date()).toISOString(), (new Date()).toISOString()
            ]]
        }
        const stmt = format('INSERT INTO classes (id, school_id, classname, shortname, created_at, updated_at) VALUES %L', data)
        pool.query(stmt).then(() => {
            return res.status(200).json({ message: 'Class data registered successfully', code: '200', data: {} })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }
    const configureClasses = (req, res) => {
        const { classes, school_id } = req.body
        const expected_payload = ['classes', 'school_id']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = classesValidator(req.body, () => {
            return extract(school_id, req, res, () => {
                let newlist = []
                for (let i = 0; i < classes.length; i++) {
                    const item = classes[i]
                    newlist = [...newlist, { class_name: capitalize(item.class_name), class_shortname: item.class_shortname.toUpperCase() }]
                }
                pool.query(GETCLASSESBYSCHOOL, [school_id]).then(result => {
                    if (result.rowCount === 0) return registerClasses(newlist, school_id, res)
                    const dataToBeRegistered = newlist.filter(item => !result.rows.some(obj => (obj.classname === item.class_name || obj.shortname === item.class_shortname)))
                    if (dataToBeRegistered.length === 0) return res.status(412).json({ message: 'Classes already registered for the school', code: '412', data: {} })
                    return registerClasses(dataToBeRegistered, school_id, res)
                }).catch(err => {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                })
            })
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const fetchClasses = (req, res) => {
        const param = new URLSearchParams(url.parse(req.url, true).query)
        if (!param.get('school')) return res.status(400).json({ message: BRS, code: '400', data: {} })
        const school = param.get('school')
        if (!school.toString().match(MONGOOBJECT)) return res.status(400).json({ message: BRS, code: '400', data: {} })
        const { pageSize, offset, page } = Pagination().Setter(param, 1, 10)
        getPageParams(pageSize, 'classes', `school_id = '${school}' AND is_displayable = true`).then(countData => {
            pool.query(PAGINATE_CLASSES, [school, pageSize, offset]).then(result => {
                if (result.rowCount === 0) return res.status(200).json({
                    message: '', code: '200', data: {
                        school_id: school, classes: [],
                        page_data: {
                            ...countData, currentPage: page, pageSize
                        }
                    }
                })
                let newlist = []
                for (let i = 0; i < result.rows.length; i++) {
                    const class_item = result.rows[i]
                    newlist = [...newlist, { ...class_item, user_id: undefined, school_id: undefined, row_id: undefined }]
                }
                return res.status(200).json({
                    message: '', code: '200', data: {
                        school_id: school, classes: [...newlist],
                        page_data: {
                            ...countData, currentPage: page, pageSize
                        }
                    }
                })
            }).catch(err => {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }
    const updateClass = (req, res) => {
        let { school_id, class_id, class_name, class_shortname } = req.body
        const expected_payload = ['school_id', 'class_id', 'class_name', 'class_shortname']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = classUpdateValidator(req.body, () => {
            return extract(school_id, req, res, () => {
                pool.query(GETCLASSWITHUSER_ID, [school_id]).then(result => {
                    if (result.rowCount === 0) return res.status(404).json({
                        message: 'No records found', code: '404', data: {}
                    })
                    class_name = capitalize(class_name), class_shortname = class_shortname.toUpperCase()
                    const classArray = result.rows
                    const data = classArray.filter(item => item.id === class_id.trim())
                    if (data.length === 0) return res.status(404).json({ message: 'No records found', code: '404', data })
                    const otherClasses = classArray.filter(item => item.id !== class_id.trim())
                    const update = () => {
                        pool.query(UPDATECLASSDATA, [class_name, class_shortname, (new Date()).toISOString(), class_id]).then(() => {
                            return res.status(200).json({
                                message: 'Class update was successful', code: '200', data: {
                                    school_id: class_id.trim(),
                                    class_data: {
                                        ...data[0], user_id: undefined, school_id: undefined, is_displayable: undefined,
                                        classname: class_name, shortname: class_shortname
                                    }
                                }
                            })
                        }).catch(err => {
                            return res.status(500).json({ message: WSWW, code: '500', data: {} })
                        })
                    }
                    if (otherClasses.length === 0) return update()
                    const dataExistenceList = otherClasses.filter(item => (
                        item.classname === item.shortname || item.shortname === class_shortname
                    ))
                    if (dataExistenceList.length > 0) return res.status(412).json({
                        message: 'Class data already exists', code: '412', data: {}
                    })
                    return update()
                }).catch(err => {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                })
            })
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const deleteClass = (req, res) => {
        const param = new URLSearchParams(url.parse(req.url, true).query)
        if (!param.get('class_id') || !param.get('school_id')) return res.status(400).json({ message: BRS, code: '400', data: {} })
        const class_id = param.get('class_id'), school_id = param.get('school_id')
        if (!class_id.toString().match(MONGOOBJECT) ||
            !school_id.toString().match(MONGOOBJECT)
        ) return res.status(400).json({ message: BRS, code: '400', data: {} })
        return extract(school_id, req, res, async () => {
            try {
                const getClass = await pool.query(CHECK_CLASS, [class_id])
                if (getClass.rowCount === 0) return res.status(404).json({ message: 'No records found', code: '404', data: {} })
                const lookUpInAcademicRecords = await pool.query(`SELECT COUNT(ar.subject_id) AS class_has_subject_with_result FROM academic_records ar INNER JOIN subjects s ON s.id = ar.subject_id WHERE s.class_id = $1`, [class_id])
                if (parseInt(lookUpInAcademicRecords.rows[0].class_has_subject_with_result) > 0) return ExecuteSoftDelete(res, class_id, 'classes')
                const data = result.rows[0]
                if (data.school_id !== school_id) return res.status(412).json({ message: 'Access denied!', code: '412', data: {} })
                await pool.query(DELETECLASS, [class_id, school_id])
                return res.status(200).json({ message: 'Class data removed successfully', code: '200', data: {} })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
    }

    // -----------------UNUSED API
    const clearAllClassesInSchool = (req, res) => {
        const param = new URLSearchParams(url.parse(req.url, true).query)
        if (!param.get('school_id')) return res.status(400).json({ message: BRS, code: '400', data: {} })
        const school_id = param.get('school_id')
        if (!school_id.toString().match(MONGOOBJECT)) return res.status(400).json({ message: BRS, code: '400', data: {} })
        return extract(school_id, req, res, () => {
            pool.query(DELETECLASSESBYSCH_ID, [school_id]).then(() => {
                return res.status(200).json({ message: 'All classes removed from the school', code: '200', data: {} })
            }).catch(err => {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            })
        })
    }
    // ----------------UNUSED API
    const searchClasses = (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('q') || !params.get('school_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const q = cleanText(params.get('q')).toLowerCase(), school_id = params.get('school_id')
        if (!school_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        pool.query(GETCLASSWITHUSER_ID, [school_id]).then(classes => {
            if (classes.rowCount === 0) return res.status(200).json({
                message: 'No matching records found', code: '200', data: {
                    classes: []
                }
            })
            const data = classes.rows
            let newlist = []
            for (let i = 0; i < data.length; i++) {
                const class_item = data[i]
                newlist = [...newlist, { ...class_item, user_id: undefined, school_id: undefined, row_id: undefined, is_displayable: undefined }]
            }
            const results = newlist.filter(item => JSON.stringify({ name: item.classname, shortname: item.shortname }).toLowerCase().includes(q))
            const filteredData = FilterSoftDeletedItems(results)
            const { pageSize, page } = Pagination().Setter(params, 1, 10)
            const { total_pages, search_results, total_items } = localPaginator(filteredData, pageSize, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    classes: [...search_results],
                    page_data: {
                        totalCount: total_items,
                        totalPages: total_pages,
                        currentPage: page,
                        pageSize: pageSize
                    }
                }
            })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }


    return {
        configureClasses, fetchClasses, deleteClass, clearAllClassesInSchool, searchClasses, updateClass
    }
}