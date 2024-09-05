import StringManipulators from '../utils/algos/StringManipulators.js'
import { Regex } from '../utils/static/index.js'

export default function AcademicsValidations() {
    const { MONGOOBJECT, DECIMAL_NUM, ALPHA } = Regex
    const { cleanExcessWhiteSpaces } = StringManipulators()
    const resultEntryValidator = (data, next) => {
        let { id, student_id, term_id, subject_id, class_score_num, class_score_denom, exam_score_num, exam_score_denom, feedback } = data
        if (!student_id.match(MONGOOBJECT) || !term_id.match(MONGOOBJECT) || !subject_id.match(MONGOOBJECT)) return { error: 'Bad request' }
        class_score_num = class_score_num.toString()
        class_score_denom = class_score_denom.toString()
        exam_score_num = exam_score_num.toString()
        exam_score_denom = exam_score_denom.toString()
        if (!class_score_num.match(DECIMAL_NUM) ||
            !class_score_denom.match(DECIMAL_NUM) ||
            !exam_score_num.match(DECIMAL_NUM) ||
            !exam_score_denom.match(DECIMAL_NUM)
        ) return { error: 'Incorrect values found' }
        const classScoreNum = parseFloat(class_score_num)
        const classScoreDenom = parseFloat(class_score_denom)
        const examScoreNum = parseFloat(exam_score_num)
        const examScoredenom = parseFloat(exam_score_denom)
        if (classScoreNum > classScoreDenom || examScoreNum > examScoredenom)
            return { error: 'Incorrect data structuring' }
        if (!feedback.match(ALPHA)) return { error: 'Unexpected chars found in feedback' }
        const resultIdIsBlank = cleanExcessWhiteSpaces(id).length === 0
        if (!resultIdIsBlank) {
            if (!id.toString().match(MONGOOBJECT)) return { error: 'Bad request' }
        }
        next()
    }

    return {
        resultEntryValidator
    }
}