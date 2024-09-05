import { ObjectId } from "bson"
import url from "url"
import DatabaseConnection from "../../config/config.db.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import SchoolQueries from "../../queries/query.school.js"
import StringManipulators from "../../utils/algos/StringManipulators.js"
import { Regex } from "../../utils/static/index.js"
import SchoolValidators from "../../validators/validator.school.js"
import Pagination from "../../helpers/helper.pagination_setter.js"
import PaginationParams from "../../helpers/helper.paginator.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import DatabaseEngine from "../../helpers/helper.engine-db.js"

export default function ConfigureSubjects() {
    const { pool } = DatabaseConnection()
    const { extract } = Eligibility_Extractor()
    const { capitalize, cleanText, cleanSCW } = StringManipulators()
    const { subjectRegistryValidator } = SchoolValidators()
    const { getPageParams, localPaginator } = PaginationParams()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { FilterSoftDeletedItems, ExecuteSoftDelete } = DatabaseEngine()
    const { UNEXPECTED_ATTR, WHITESPACES, MONGOOBJECT } = Regex
    const { GETSUBJECTS_BY_SCHOOL, SAVE_SUBJECT, CHECKCLASS_IN_SCHOOL, UPDATE_SUBJECT, GET_SUBJECT,
        PAGINATE_SUBJECTS_BY_CLASS, PAGINATE_SUBJECTS_BY_SCHOOL, RETRIEVE_SUBJECTS_FOR_SEARCH, CHECK_SUBJECT,
        DELETE_SUBJECT, CHECK_CLASS, DELETE_SUBJECT_BY_CLASS, DELETE_SUBJECT_BY_SCHOOL } = SchoolQueries()
    const WSWW = 'Whoops! Something went wrong!'
    const saveSubject = (res, school_id, subject_name, subject_code, class_id) => {
        const subject_id = (new ObjectId()).toString()
        const timestamp = (new Date()).toISOString()
        pool.query(SAVE_SUBJECT, [subject_id, school_id, class_id, subject_code,
            subject_name, timestamp
        ]).then(() => {
            return res.status(201).json({
                message: 'Subject created successfully', code: '201', data: {
                    id: subject_id, school_id, class_id, subject_code,
                    subject_name, created_at: timestamp, updated_at: timestamp
                }
            })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }
    const createSubject = (req, res) => {
        let { school_id, subject_name, subject_code, class_id } = req.body
        const expected_payload = ['school_id', 'subject_name', 'subject_code', 'class_id']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = subjectRegistryValidator(req.body, () => {
            return extract(school_id, req, res, () => {
                // subject_name = cleanSCW(subject_name)
                subject_code = subject_code.replace(UNEXPECTED_ATTR, '').replace(WHITESPACES, ' ').toUpperCase()
                pool.query(CHECKCLASS_IN_SCHOOL, [school_id, class_id]).then(classes => {
                    if (classes.rowCount !== 1) return res.status(412).json({ message: 'Class does not exist in this school', code: '412', data: {} })
                    pool.query(GETSUBJECTS_BY_SCHOOL, [school_id]).then(result => {
                        if (result.rowCount === 0) return saveSubject(res, school_id, subject_name, subject_code, class_id)
                        const data = result.rows
                        const checkCodeInArray = data.filter(item => item.subject_code === subject_code)
                        if (checkCodeInArray.length > 0) return res.status(412).json({ message: 'Subject code already exists', data: {} })
                        let shouldReject = false
                        for (let i = 0; i < data.length; i++) {
                            const item = data[i]
                            if (item.subject_name === subject_name &&
                                item.class_id === class_id
                            ) shouldReject = true
                        }
                        if (shouldReject) return res.status(412).json({ message: 'Selected class already has this subject' })
                        return saveSubject(res, school_id, subject_name, subject_code, class_id)
                    }).catch(err => {
                        return res.status(500).json({ message: WSWW, code: '500', data: {} })
                    })
                }).catch(err => {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                })
            })
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const update = (res, subject, subject_id, class_id, subject_code, subject_name) => {
        const timestamp = (new Date()).toISOString()
        if (
            subject.class_id === class_id &&
            subject.subject_code === subject_code &&
            subject.subject_name === subject_name
        ) return res.status(412).json({ message: 'No changes found yet', code: '412', data: {} })
        pool.query(UPDATE_SUBJECT, [
            class_id, subject_code, subject_name, timestamp, subject_id
        ]).then(() => {
            return res.status(200).json({
                message: 'Subject was updated successfully', code: '200', data: {
                    ...subject, class_id, subject_code, subject_name, updated_at: timestamp, row_id: undefined
                }
            })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }
    const updateSubject = (req, res) => {
        let { subject_id, school_id, class_id, subject_code, subject_name } = req.body
        const expected_payload = ['subject_id', 'school_id', 'class_id', 'subject_code', 'subject_name']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        if (!subject_id.toString().match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = subjectRegistryValidator(req.body, () => {
            return extract(school_id, req, res, () => {
                // subject_name = cleanSCW(subject_name)
                subject_code = subject_code.replace(UNEXPECTED_ATTR, '').replace(WHITESPACES, ' ').toUpperCase()
                pool.query(CHECKCLASS_IN_SCHOOL, [school_id, class_id]).then(classes => {
                    if (classes.rowCount !== 1) return res.status(412).json({ message: 'Class does not exist in this school', code: '412', data: {} })
                    pool.query(GETSUBJECTS_BY_SCHOOL, [school_id]).then(result => {
                        if (result.rowCount === 0) return res.status(404).json({ message: 'No records found', code: '404', data: {} })
                        const data = result.rows
                        const thisItem = data.filter(subj => subj.id === subject_id)
                        if (thisItem.length === 0) return res.status(404).json({ message: 'No records found', code: '404', data: {} })
                        const listByClass = data.filter(item => item.class_id === class_id)
                        let shouldReject = false
                        for (let i = 0; i < listByClass.length; i++) {
                            const subject = listByClass[i]
                            if (subject.subject_name === subject_name &&
                                subject.id !== subject_id
                            ) shouldReject = true
                        }
                        if (shouldReject) return res.status(412).json({ message: 'Selected class already has this subject name' })
                        const checkCodeInArray = data.filter(item => item.subject_code === subject_code)
                        if (checkCodeInArray.length !== 1) return update(res, thisItem[0], subject_id, class_id, subject_code, subject_name)
                        if (checkCodeInArray[0].id !== subject_id) return res.status(412).json({ message: 'Subject code has already been taken', code: '412', data: {} })
                        return update(res, thisItem[0], subject_id, class_id, subject_code, subject_name)
                    }).catch(err => {
                        return res.status(500).json({ message: WSWW, code: '500', data: {} })
                    })
                }).catch(err => {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                })
            })
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const getSubject = (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('subject_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const subject_id = params.get('subject_id')
        if (!subject_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        pool.query(GET_SUBJECT, [subject_id]).then(result => {
            if (result.rowCount === 0) return res.status(200).json({ message: '', code: '200', data: {} })
            return res.status(200).json({ message: '', code: '200', data: { ...result.rows[0] } })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }
    const getSubjectsByClass = (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('class_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const class_id = params.get('class_id')
        if (!class_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const { pageSize, offset, page } = Pagination().Setter(params, 1, 10)
        getPageParams(pageSize, 'subjects', `class_id = '${class_id}' AND is_displayable = true`).then(countData => {
            pool.query(PAGINATE_SUBJECTS_BY_CLASS, [class_id, pageSize, offset]).then(result => {
                if (result.rowCount === 0) return res.status(200).json({
                    message: '', code: '200', data: {
                        subjects: [],
                        page_data: {
                            ...countData, currentPage: page, pageSize
                        }
                    }
                })
                return res.status(200).json({
                    message: '', code: '200', data: {
                        subjects: [...result.rows],
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
    const getSubjectsBySchool = (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('school_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const school_id = params.get('school_id')
        if (!school_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const { pageSize, offset, page } = Pagination().Setter(params, 1, 10)
        getPageParams(pageSize, 'subjects', `school_id = '${school_id}' AND is_displayable = true`).then(countData => {
            pool.query(PAGINATE_SUBJECTS_BY_SCHOOL, [school_id, pageSize, offset]).then(result => {
                return res.status(200).json({
                    message: '', code: '200', data: {
                        subjects: [...result.rows],
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
    const searchSubjects = (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('school_id') ||
            !params.get('q')
        ) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const school_id = params.get('school_id')
        const q = cleanText(params.get('q')).toLowerCase()
        if (!school_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        pool.query(RETRIEVE_SUBJECTS_FOR_SEARCH, [school_id]).then(results => {
            const data = results.rows.filter(item => JSON.stringify({
                ...item, id: undefined, created_at: undefined, updated_at: undefined
            }).toLowerCase().includes(q))
            const { pageSize, page } = Pagination().Setter(params, 1, 10)
            const { total_pages, search_results, total_items } = localPaginator(data, pageSize, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    subjects: [...search_results],
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
    const removeASubject = (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('subject_id') ||
            !params.get('school_id')
        ) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const subject_id = params.get('subject_id')
        const school_id = params.get('school_id')
        if (!subject_id.match(MONGOOBJECT) ||
            !school_id.match(MONGOOBJECT)
        ) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        return extract(school_id, req, res, async () => {
            try {
                const getSubject = await pool.query(CHECK_SUBJECT, [subject_id])
                if (getSubject.rowCount === 0) return res.status(404).json({ message: 'No records found', code: '404', data: {} })
                const lookUpInAcademicRecords = await pool.query(`SELECT COUNT(id) AS subject_in_results FROM academic_records WHERE subject_id = $1`, [subject_id])
                if (parseInt(lookUpInAcademicRecords.rows[0].subject_in_results) > 0) return ExecuteSoftDelete(res, subject_id, 'subjects')
                const data = getSubject.rows[0]
                if (data.school_id !== school_id) return res.status(412).json({ message: 'Access denied!', code: '412', data: {} })
                await pool.query(DELETE_SUBJECT, [subject_id])
                return res.status(200).json({ message: 'Record deleted successfully', code: '200', data: {} })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
    }

    // Unused APIs
    const removeSubjectsByClass = (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('school_id') ||
            !params.get('class_id')
        ) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const school_id = params.get('school_id')
        const class_id = params.get('class_id')
        if (!school_id.match(MONGOOBJECT) ||
            !class_id.match(MONGOOBJECT)
        ) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        return extract(school_id, req, res, () => {
            pool.query(CHECK_CLASS, [class_id]).then(result => {
                if (result.rowCount === 0) return res.status(404).json({ message: 'No records found', code: '404', data: {} })
                const data = result.rows[0]
                if (data.school_id !== school_id) return res.status(412).json({ message: 'Access denied!', code: '412', data: {} })
                pool.query(DELETE_SUBJECT_BY_CLASS, [class_id]).then(() => {
                    return res.status(200).json({ message: 'Records were successfully removed', code: '200', data: {} })
                }).catch(err => {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                })
            }).catch(err => {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            })
        })
    }
    const removeSubjectsBySchool = (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('school_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const school_id = params.get('school_id')
        if (!school_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        return extract(school_id, req, res, () => {
            pool.query(DELETE_SUBJECT_BY_SCHOOL, [school_id]).then(() => {
                return res.status(200).json({ message: 'Records were successfully removed', code: '200', data: {} })
            }).catch(err => {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            })
        })
    }
    return {
        createSubject, updateSubject, getSubject, getSubjectsByClass, getSubjectsBySchool, searchSubjects,
        removeASubject, removeSubjectsByClass, removeSubjectsBySchool
    }
}