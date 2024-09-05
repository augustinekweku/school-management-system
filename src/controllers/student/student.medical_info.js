import DatabaseConnection from "../../config/config.db.js"
import MedicalInformationValidations from "../../validators/validator.medical_info.js"
import ParentQuery from "../../queries/query.parent.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import MedicalInformationQuery from "../../queries/query.medical_info.js"
import StringManipulators from "../../utils/algos/StringManipulators.js"
import { ObjectId } from "bson"
import { Regex } from "../../utils/static/index.js"
import url from "url"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"

export default function StudentMedicalInformation() {
    const { createMedicalInfoValidator, updateMedicalInfoValidator } = MedicalInformationValidations()
    const { cleanExcessWhiteSpaces, cleanSCW } = StringManipulators()
    const { extract } = Eligibility_Extractor()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { CHECK_EXISTENCE, SAVE_MEDICAL_INFO, UPDATE_INFO, GETMEDICAL_BY_ID, GETINFO_BY_SID, REMOVE_INFO } = MedicalInformationQuery()
    const { GETSTUDENT } = ParentQuery()
    const { pool } = DatabaseConnection()
    const { MONGOOBJECT } = Regex
    const WSWW = 'Whoops! Something went wrong'
    const CheckExistence = async (student) => {
        try {
            const check = await pool.query(CHECK_EXISTENCE, [student])
            return check
        } finally {
            console.log(true);
        }
    }
    const create = (res, student_id, pediatrician, telephone, previous_diseases) => {
        const id = (new ObjectId()).toString()
        const timestamp = (new Date()).toISOString()
        pool.query(SAVE_MEDICAL_INFO, [
            id, student_id, pediatrician, telephone, previous_diseases, timestamp
        ]).then(student => {
            const data = student.rows[0]
            return res.status(201).json({
                message: 'Medical information created successfully', code: '201', data: {
                    id, pediatrician, telephone, previous_diseases, created_at: timestamp, updated_at: timestamp, student: { ...data }
                }
            })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }
    const createMedicalInformation = (req, res) => {
        let { student_id, pediatrician, telephone, previous_diseases } = req.body
        const expected_payload = ['student_id', 'pediatrician', 'telephone', 'previous_diseases']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = createMedicalInfoValidator(req.body, () => {
            pool.query(GETSTUDENT, [student_id]).then(student => {
                if (student.rowCount === 0) return res.status(412).json({ message: 'Student could not be found', code: '412', data: {} })
                const sData = student.rows[0]
                return extract(sData.school_id, req, res, () => {
                    CheckExistence(student_id).then(exists => {
                        if (exists.rowCount === 1) return res.status(412).json({ message: 'Medical information of this student is already created', code: '412', data: {} })
                        // pediatrician = cleanExcessWhiteSpaces(pediatrician)
                        telephone = cleanExcessWhiteSpaces(telephone).length === 0 ? null : cleanExcessWhiteSpaces(telephone)
                        previous_diseases = previous_diseases.length === 0 ? ['none'] : previous_diseases
                        return create(res, student_id, pediatrician, telephone, previous_diseases)
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
    const update = (res, data, info_id, pediatrician, telephone, previous_diseases) => {
        const timestamp = (new Date()).toISOString()
        pool.query(UPDATE_INFO, [pediatrician, telephone, previous_diseases, timestamp, info_id]).then(() => {
            return res.status(200).json({
                message: "Student's medical information updated successfully", code: '200', data: {
                    id: info_id, pediatrician, telephone, previous_diseases, created_at: data.created_at, updated_at: timestamp,
                    student: {
                        id: data.student_id, firstname: data.firstname, othername: data.othername,
                        lastname: data.lastname, index_no: data.index_no
                    }
                }
            })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }
    const updateMedicalInformation = (req, res) => {
        let { info_id, pediatrician, telephone, previous_diseases } = req.body
        const expected_payload = ['info_id', 'pediatrician', 'telephone', 'previous_diseases']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = updateMedicalInfoValidator(req.body, () => {
            pool.query(GETMEDICAL_BY_ID, [info_id]).then(result => {
                if (result.rowCount === 0) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
                const data = result.rows[0]
                return extract(data.school_id, req, res, () => {
                    // pediatrician = cleanExcessWhiteSpaces(pediatrician)
                    telephone = cleanExcessWhiteSpaces(telephone).length === 0 ? null : cleanExcessWhiteSpaces(telephone)
                    previous_diseases = previous_diseases.length === 0 ? ['none'] : previous_diseases
                    return update(res, data, info_id, pediatrician, telephone, previous_diseases)
                })
            }).catch(err => {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            })
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const getMedicalInformation = (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('student_id')) return res.status(200).json({ message: '', code: '200', data: {} })
        const student_id = params.get('student_id')
        if (!student_id.match(MONGOOBJECT)) return res.status(200).json({ message: '', code: '200', data: {} })
        pool.query(GETINFO_BY_SID, [student_id]).then(info => {
            if (info.rowCount === 0) return res.status(200).json({ message: '', code: '200', data: {} })
            const data = info.rows[0]
            return res.status(200).json({
                message: '', code: '200', data: {
                    id: data.id,
                    pediatrician: data.pediatrician,
                    telephone: data.telephone,
                    previous_diseases: data.previous_diseases,
                    student: {
                        id: data.student_id,
                        firstname: data.firstname,
                        othername: data.othername,
                        lastname: data.lastname,
                        index_no: data.index_no,
                        gender: data.gender
                    }
                }
            })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }
    const removeMedicalInformation = (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('medical_info_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const id = params.get('medical_info_id')
        if (!id.match(MONGOOBJECT)) return res.status(200).json({ message: 'Bad request', code: '400', data: {} })
        pool.query(GETMEDICAL_BY_ID, [id]).then(result => {
            if (result.rowCount === 0) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
            const data = result.rows[0]
            return extract(data.school_id, req, res, () => {
                pool.query(REMOVE_INFO, [id]).then(() => {
                    return res.status(200).json({
                        message: "Student's medical information removed successfully", code: '200', data: {}
                    })
                }).catch(err => {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                })
            })
        }).catch(err => {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        })
    }
    return {
        createMedicalInformation, updateMedicalInformation, getMedicalInformation, removeMedicalInformation
    }
}