import { ObjectId } from "bson"
import DatabaseConnection from "../../config/config.db.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import DiseaseQuery from "../../queries/query.disease.js"
import StudentImmunityQuery from "../../queries/query.immunity.js"
import ParentQuery from "../../queries/query.parent.js"
import StudentImmunityValidations from "../../validators/validator.immunity.js"
import url from "url"
import { Regex } from "../../utils/static/index.js"
import Pagination from "../../helpers/helper.pagination_setter.js"
import PaginationParams from "../../helpers/helper.paginator.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"

export default function StudentImmunityRecords() {
    const { createImmunityValidator } = StudentImmunityValidations()
    const { extract } = Eligibility_Extractor()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { pool } = DatabaseConnection()
    const { GETDISEASE } = DiseaseQuery()
    const { GETSTUDENT } = ParentQuery()
    const { CHECK_RECORD, SAVE_RECORD, GETRECORD, DELETE_RECORD, GETRECORDS, FETCHRECORD } = StudentImmunityQuery()
    const WSWW = 'Whoops! Something went wrong'
    const { MONGOOBJECT } = Regex

    const CheckDisease = async (disease_id) => {
        try {
            const check = await pool.query(GETDISEASE, [disease_id])
            return check
        } finally {
            console.log(true)
        }
    }
    const CheckStudent = async (student_id) => {
        try {
            const check = await pool.query(GETSTUDENT, [student_id])
            return check
        } finally {
            console.log(true)
        }
    }
    const CheckRecordExistence = async (student_id, disease_id) => {
        try {
            const check = await pool.query(CHECK_RECORD, [student_id, disease_id])
            return check
        } finally {
            console.log(true);
        }
    }

    const createImmunityRecord = (req, res) => {
        const { disease_id, student_id, date } = req.body
        const expected_payload = ['disease_id', 'student_id', 'date']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = createImmunityValidator(req.body, () => {
            CheckDisease(disease_id).then(disease => {
                if (disease.rowCount !== 1) return res.status(412).json({ message: 'Chosen disease does not exists', code: '412', data: {} })
                const diseaseData = disease.rows[0]
                CheckStudent(student_id).then(student => {
                    if (student.rowCount !== 1) return res.status(412).json({ message: 'Student does not exists', code: '412', data: {} })
                    const studentData = student.rows[0]
                    if (diseaseData.school_id !== studentData.school_id) return res.status(412).json({ message: 'Data mismatch detected', code: '412', data: {} })
                    return extract(diseaseData.school_id, req, res, () => {
                        CheckRecordExistence(student_id, disease_id).then(data_existence => {
                            if (data_existence.rowCount === 1) return res.status(412).json({ message: 'Data already exists', code: '412', data: {} })
                            const id = (new ObjectId()).toString()
                            const timestamp = (new Date()).toISOString()
                            pool.query(SAVE_RECORD, [id, student_id, disease_id, date, timestamp]).then(saved => {
                                return res.status(201).json({
                                    message: 'Record saved successfully', code: '201', data: {
                                        id, date: saved.rows[0].date,
                                        disease: {
                                            id: diseaseData.id,
                                            disease: diseaseData.disease,
                                            description: diseaseData.description,
                                        },
                                        student: {
                                            id: studentData.id,
                                            firstname: studentData.firstname,
                                            othername: studentData.othername,
                                            lastname: studentData.lastname,
                                            gender: studentData.gender,
                                            index_no: studentData.index_no
                                        }
                                    }
                                })
                            }).catch(err => {
                                return res.status(500).json({ message: WSWW, code: '500', data: {} })
                            })
                        }).catch(err => {
                            return res.status(500).json({ message: WSWW, code: '500', data: {} })
                        })
                    })
                }).catch(err => {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                })
            }).catch(err => {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            })
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const deleteImmunityRecord = (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('immunization_record_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const rid = params.get('immunization_record_id')
        if (!rid.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        pool.query(GETRECORD, [rid]).then(record => {
            if (record.rowCount !== 1) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
            const data = record.rows[0]
            return extract(data.school_id, req, res, () => {
                pool.query(DELETE_RECORD, [rid]).then(() => {
                    return res.status(200).json({ message: 'Immunization record has been removed successfully', code: '200', data: {} })
                }).catch(err => {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                })
            })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }
    const processData = (data) => {
        const studentData = data.map(({
            id, date, disease_id, disease, description, ...rest
        }) => rest)[0]
        const immunizationData = data.map(({
            student_id, firstname, othername, lastname, gender, index_no, ...rest
        }) => rest)
        return { studentData, immunizationData }
    }
    const getImmunizationRecords = (req, res) => {
        const dataInterface = {
            student: {},
            immunization_records: [],
            page_data: {}
        }
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('student_id')) return res.status(200).json({ message: '', code: '200', data: { ...dataInterface } })
        const student_id = params.get('student_id')
        if (!student_id.match(MONGOOBJECT)) return res.status(200).json({ message: '', code: '200', data: { ...dataInterface } })
        const { pageSize, offset, page } = Pagination().Setter(params, 1, 10)
        PaginationParams().getPageParams(pageSize, 'immunization_records', `student_id = '${student_id}'`).then(countData => {
            pool.query(GETRECORDS, [student_id, pageSize, offset]).then(records => {
                const { studentData, immunizationData } = processData(records.rows)
                return res.status(200).json({
                    message: '', code: '200', data: {
                        ...dataInterface,
                        student: { ...studentData },
                        immunization_records: [...immunizationData],
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
    const getImmunityRecord = (req, res) => {
        const dataInterface = {
            student: {},
            immunization_records: {}
        }
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('immunization_record_id')) return res.status(200).json({ message: '', code: '200', data: { ...dataInterface } })
        const rid = params.get('immunization_record_id')
        if (!rid.match(MONGOOBJECT)) return res.status(200).json({ message: '', code: '200', data: { ...dataInterface } })
        pool.query(FETCHRECORD, [rid]).then(record => {
            const { studentData, immunizationData } = processData(record.rows)
            return res.status(200).json({
                message: '', code: '200', data: {
                    ...dataInterface,
                    student: { ...studentData },
                    immunization_records: { ...immunizationData[0] }
                }
            })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }

    return {
        createImmunityRecord, deleteImmunityRecord, getImmunizationRecords, getImmunityRecord
    }
}