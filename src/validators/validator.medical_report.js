import StringManipulators from "../utils/algos/StringManipulators.js"
import { Regex } from "../utils/static/index.js"

export default function StudentMedicalReportValidations() {
    const { MONGOOBJECT } = Regex
    const { polishLongTexts } = StringManipulators()
    const createReportValidator = (data, next) => {
        const { student_id, report } = data
        if (!student_id.match(MONGOOBJECT)) return { error: 'Bad request' }
        if (polishLongTexts(report).length < 10) return { error: 'Report must be at least 10 chars' }
        next()
    }
    const updateReportValidator = (data, next) => {
        const { report_id, report } = data
        if (!report_id.match(MONGOOBJECT)) return { error: 'Bad request' }
        if (polishLongTexts(report).length < 10) return { error: 'Report must be at least 10 chars' }
        next()
    }
    return {
        createReportValidator, updateReportValidator
    }
}