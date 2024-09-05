import { ObjectId } from "bson"
import DatabaseConnection from "../../config/config.db.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import ParentQuery from "../../queries/query.parent.js"
import StringManipulators from "../../utils/algos/StringManipulators.js"
import StudentMedicalReportValidations from "../../validators/validator.medical_report.js"
import MedicalReportQuery from "../../queries/query.medical_report.js"
import url from "url"
import { Regex } from "../../utils/static/index.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"

export default function StudentMedicalReport() {
    const { createReportValidator, updateReportValidator } = StudentMedicalReportValidations()
    const { extract } = Eligibility_Extractor()
    const { polishLongTexts } = StringManipulators()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { pool } = DatabaseConnection()
    const { GETSTUDENT } = ParentQuery()
    const { MONGOOBJECT } = Regex
    const { CHECK_EXISTENCE, SAVE_REPORT, GETREPORT, UPDATE_REPORT, GETREPORTBYSID, DELETE_REPORT } = MedicalReportQuery()
    const WSWW = 'Whoops! Something went wrong'
    const CheckStudent = async (student_id) => {
        try {
            const check = await pool.query(GETSTUDENT, [student_id])
            return check
        } finally {
            console.log(true)
        }
    }
    const CheckExistence = async (student_id) => {
        try {
            const check = await pool.query(CHECK_EXISTENCE, [student_id])
            return check
        } finally {
            console.log(true)
        }
    }
    const createReport = (req, res) => {
        let { student_id, report } = req.body
        const expected_payload = ['student_id', 'report']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = createReportValidator(req.body, () => {
            CheckStudent(student_id).then(student => {
                if (student.rowCount === 0) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
                const sData = student.rows[0]
                return extract(sData.school_id, req, res, () => {
                    report = polishLongTexts(report)
                    const id = (new ObjectId()).toString()
                    const timestamp = (new Date()).toISOString()
                    CheckExistence(student_id).then(reports => {
                        if (reports.rowCount === 1) return res.status(412).json({ message: "Student's medical report already registered", code: '412', data: {} })
                        pool.query(SAVE_REPORT, [id, student_id, report, timestamp]).then(() => {
                            return res.status(201).json({
                                message: "Student's medical report created successfully",
                                code: '201',
                                data: {
                                    id,
                                    report,
                                    created_at: timestamp,
                                    updated_at: timestamp,
                                    student: {
                                        id: sData.id,
                                        firstname: sData.firstname,
                                        othername: sData.othername,
                                        lastname: sData.lastname,
                                        gender: sData.gender,
                                        index_no: sData.index_no
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
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const updateReport = (req, res) => {
        let { report_id, report } = req.body
        const expected_payload = ['report_id', 'report']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = updateReportValidator(req.body, () => {
            pool.query(GETREPORT, [report_id]).then(report_info => {
                if (report_info.rowCount === 0) return res.status(412).json({ message: 'No record found', code: '412', data: {} })
                const data = report_info.rows[0]
                return extract(data.school_id, req, res, () => {
                    report = polishLongTexts(report)
                    const timestamp = (new Date()).toISOString()
                    pool.query(UPDATE_REPORT, [report, timestamp, report_id]).then(() => {
                        return res.status(200).json({
                            message: "Student's medicl report was updated successfully",
                            code: '200',
                            data: {
                                id: report_id,
                                report,
                                created_at: data.created_at,
                                updated_at: timestamp,
                                student: {
                                    id: data.student_id,
                                    firstname: data.firstname,
                                    othername: data.othername,
                                    lastname: data.lastname,
                                    gender: data.gender,
                                    index_no: data.index_no
                                }
                            }
                        })
                    }).catch(err => {
                        return res.status(500).json({ message: WSWW, code: '500', data: {} })
                    })
                })
            }).catch(err => {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            })
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const getReport = (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('student_id')) return res.status(200).json({ message: '', code: '200', data: {} })
        const student_id = params.get('student_id')
        if (!student_id.match(MONGOOBJECT)) return res.status(200).json({ message: '', code: '200', data: {} })
        pool.query(GETREPORTBYSID, [student_id]).then(report => {
            if (report.rowCount === 0) return res.status(200).json({ message: '', code: '200', data: {} })
            const data = report.rows[0]
            return res.status(200).json({
                message: '',
                code: '200',
                data: {
                    id: data.id,
                    report: data.report,
                    created_at: data.created_at,
                    updated_at: data.updated_at,
                    student: {
                        id: data.student_id,
                        firstname: data.firstname,
                        othername: data.othername,
                        lastname: data.lastname,
                        gender: data.gender,
                        index_no: data.index_no
                    }
                }
            })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }
    const deleteReport = (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('report_id')) return res.status(400).json({ message: '', code: '400', data: {} })
        const report_id = params.get('report_id')
        if (!report_id.match(MONGOOBJECT)) return res.status(400).json({ message: '', code: '400', data: {} })
        pool.query(GETREPORT, [report_id]).then(report_info => {
            if (report_info.rowCount === 0) return res.status(412).json({ message: 'No record found', code: '412', data: {} })
            const data = report_info.rows[0]
            return extract(data.school_id, req, res, () => {
                pool.query(DELETE_REPORT, [report_id]).then(() => {
                    return res.status(200).json({ message: "Student's medical report deleted successfully", code: '200', data: {} })
                }).catch(err => {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                })
            })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }

    return {
        createReport, updateReport, getReport, deleteReport
    }
}