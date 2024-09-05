import { ObjectId } from "bson"
import DatabaseConnection from "../../config/config.db.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import GradingSystemQuery from "../../queries/query.grading_system.js"
import GradingSystemValidations from "../../validators/validator.grading_system.js"
import StringManipulators from "../../utils/algos/StringManipulators.js"
import format from "pg-format"
import url from "url"
import { Regex } from "../../utils/static/index.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"

export default function GradingSystemConfiguration() {
    const { gradingSystemValidations } = GradingSystemValidations()
    const { pool } = DatabaseConnection()
    const { MONGOOBJECT } = Regex
    const { cleanSCW } = StringManipulators()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const WSWW = 'Whoops! Something went wrong'
    const { extract } = Eligibility_Extractor()
    const { RETRIEVE_GRADINGS, REMOVE_GRADINGS, UPDATE_GRADINGS, ENTERSPLIT_PERCENTAGE, CHECKSPLIT_PERCENTAGE, UPDATESPLIT_PERCENTAGE } = GradingSystemQuery()
    const CheckGradingSystem = async (school_id) => {
        try {
            const grades = await pool.query(RETRIEVE_GRADINGS, [school_id])
            return grades
        } finally {
            console.log(true)
        }
    }
    const RegisterSplitPercentage = async (schoolId, tClassScore, tExamScore) => {
        try {
            const check = await pool.query(CHECKSPLIT_PERCENTAGE, [schoolId])
            if (check.rowCount === 1) {
                const { total_class_score, total_exam_score } = check.rows[0]
                if (total_class_score === tClassScore && total_exam_score === tExamScore) return {
                    status: 2,
                    split_percentage: {
                        total_class_score, total_exam_score
                    }
                }
                const updatePercentage = await pool.query(UPDATESPLIT_PERCENTAGE, [tClassScore, tExamScore, schoolId])
                return {
                    status: updatePercentage.rowCount,
                    split_percentage: {
                        total_class_score: tClassScore,
                        total_exam_score: tExamScore
                    }
                }
            }
            const register = await pool.query(ENTERSPLIT_PERCENTAGE, [schoolId, tClassScore, tExamScore])
            return {
                status: register.rowCount,
                split_percentage: {
                    total_class_score: tClassScore,
                    total_exam_score: tExamScore
                }
            }
        } finally {
            console.log(true)
        }
    }

    const updateGradingSystem = async (res, grades, grading_system, school_id, total_class_score, total_exam_score) => {
        try {
            let data = []
            const dbGradingSystem = grades.map(({ created_at, updated_at, ...rest }) => rest)
            grading_system.map(item => {
                const lowest = parseFloat(item.lowest_mark)
                const highest = parseFloat(item.highest_mark)
                const grade = item.grade.toUpperCase()
                const remark = cleanSCW(item.remark)
                data = [...data, { id: item.id, lowest_mark: lowest, highest_mark: highest, grade, remark }]
            })
            const changesInDBData = (fromDB, fromClient) => {
                const dbDataToString = new Set(fromDB.map(obj => JSON.stringify(obj)))
                const changes = fromClient.filter(obj => !dbDataToString.has(JSON.stringify(obj)))
                return changes
            }
            const changes = changesInDBData(dbGradingSystem, data)
            if (changes.length === 0) return res.status(412).json({ message: 'No changes found', code: '412', data: {} })
            const timestamp = (new Date()).toISOString()
            let count = 0
            for (let i = 0; i < changes.length; i++) {
                const item = changes[i]
                const update = await pool.query(UPDATE_GRADINGS, [
                    item.lowest_mark,
                    item.highest_mark,
                    item.grade,
                    item.remark,
                    timestamp,
                    item.id
                ])
                if (update.rowCount > 0) count = count += 1
            }
            const { status, split_percentage } = await RegisterSplitPercentage(school_id, total_class_score, total_exam_score)
            if (count > 0) return res.status(200).json({
                message: `${count} of ${changes.length} changed ${count > 1 ? 'items' : 'item'} ${count > 1 ? 'were' : 'was'} updated${status === 2 ? '. Split percentage remains the same. You may kindly run an update on it.' : status === 1 ? ' and split percentage also saved' : ' but split percentage failed to save'}`, code: '200', data: {
                    school_id,
                    grading_system: grades.map(grade => {
                        const gradeUpdate = changes.find(update => update.id === grade.id)
                        return gradeUpdate ? { ...grade, ...gradeUpdate, updated_at: timestamp } : grade
                    }),
                    split_percentage: {
                        total_class_score: status > 0 ? split_percentage.total_class_score : null,
                        total_exam_score: status > 0 ? split_percentage.total_exam_score : null
                    }
                }
            })
            return res.status(412).json({ message: 'Update has failed', code: '412', data: {} })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const createGradingSystem = (req, res) => {
        let { school_id, grading_system, total_class_score, total_exam_score } = req.body
        const expected_payload = ['school_id', 'grading_system', 'total_class_score', 'total_exam_score']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const sumTotal = parseFloat(total_class_score) + parseFloat(total_exam_score)
        if (sumTotal !== 100) return res.status(412).json({ message: 'Incorrect split percentage', code: '412', data: {} })
        const validate = gradingSystemValidations(req.body, async () => {
            return extract(school_id, req, res, async () => {
                try {
                    const grades = await CheckGradingSystem(school_id)
                    if (grades.rowCount > 0) {
                        const gradeList = grades.rows
                        const checkIdPrescence = grading_system.filter(grds_payload => !gradeList.map(grds => grds.id).includes(grds_payload.id))
                        if (checkIdPrescence.length > 0) return res.status(412).json({ message: `${checkIdPrescence.length} row${checkIdPrescence.length > 1 ? 's' : ''} in your grading system ${checkIdPrescence.length > 1 ? 'do' : 'does'} not have matching identification with data in records`, code: '412', data: {} })
                        const grdsPayloadIds = [...new Set(grading_system.map(grds_payload => grds_payload.id))]
                        if (grdsPayloadIds.length !== grading_system.length) return res.status(412).json({ message: 'Duplicates detected in the grading system', code: '412', data: {} })
                        return updateGradingSystem(res, gradeList, grading_system, school_id, parseInt(total_class_score), parseInt(total_exam_score))
                    }
                    let data = []
                    const values = grading_system.map(item => {
                        const id = (new ObjectId()).toString()
                        const timestamp = (new Date()).toISOString()
                        const lowest = parseFloat(item.lowest_mark)
                        const highest = parseFloat(item.highest_mark)
                        const grade = item.grade.toUpperCase()
                        const remark = cleanSCW(item.remark)
                        data = [...data, { id, lowest_mark: lowest, highest_mark: highest, grade, remark, created_at: timestamp, updated_at: timestamp }]
                        return [
                            id, school_id, lowest, highest, grade, remark, timestamp, timestamp
                        ]
                    })
                    const Query = format(`INSERT INTO grading_system (id, school_id, lowest_mark, highest_mark, grade, remark, created_at, updated_at) VALUES %L`, values)
                    await pool.query(Query)
                    const { status, split_percentage } = await RegisterSplitPercentage(school_id, parseInt(total_class_score), parseInt(total_exam_score))
                    return res.status(201).json({
                        message: `Grading system successfully created${status === 2 ? '. Split percentage remains the same.' : status === 1 ? ' and split percentage also saved' : ' but split percentage failed to save'}`, code: '201', data: {
                            school_id,
                            grading_system: [...data],
                            split_percentage: {
                                total_class_score: status > 0 ? split_percentage.total_class_score : null,
                                total_exam_score: status > 0 ? split_percentage.total_exam_score : null
                            }
                        }
                    })
                } catch (error) {
                    return res.status(500).json({ message: WSWW, code: '500', data: {} })
                }
            })
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const fetchGradingSystem = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('school_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const school_id = params.get('school_id')
        if (!school_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        try {
            const grades = await CheckGradingSystem(school_id)
            const split_percentage = await pool.query(CHECKSPLIT_PERCENTAGE, [school_id])
            return res.status(200).json({
                message: '', code: '200', data: {
                    school_id,
                    grading_system: [...grades.rows],
                    split_percentage: split_percentage.rowCount === 0 ? {
                        total_class_score: null,
                        total_exam_score: null
                    } : {
                        total_class_score: split_percentage.rows[0].total_class_score,
                        total_exam_score: split_percentage.rows[0].total_exam_score
                    }
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const removeGradingSystem = (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('school_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const school_id = params.get('school_id')
        if (!school_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        return extract(school_id, req, res, async () => {
            try {
                const removeGradings = await pool.query(REMOVE_GRADINGS, [school_id])
                if (removeGradings.rowCount === 0) return res.status(200).json({ message: 'No records found', code: '412', data: {} })
                return res.status(200).json({ message: 'Grading system has been cleared', code: '200', data: {} })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
    }

    return {
        createGradingSystem, fetchGradingSystem, removeGradingSystem
    }
}