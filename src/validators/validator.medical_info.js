import { Regex } from "../utils/static/index.js"
import StringManipulators from "../utils/algos/StringManipulators.js"

export default function MedicalInformationValidations() {
    const { cleanExcessWhiteSpaces } = StringManipulators()
    const { MONGOOBJECT, ALPHA, NUMERICAL, CSVDOT_HYPHEN } = Regex
    const createMedicalInfoValidator = (data, next) => {
        const { student_id, pediatrician, telephone, previous_diseases } = data
        if (!student_id.match(MONGOOBJECT)) return { error: 'Bad request' }
        const pediatricianIsBlank = cleanExcessWhiteSpaces(pediatrician).length === 0
        const phoneIsBlank = cleanExcessWhiteSpaces(telephone).length === 0
        if (!pediatricianIsBlank) {
            // if (!pediatrician.match(ALPHA)) return { error: 'Name of pediatrician should only contain English alphabets and whitespaces' }
            if (pediatrician.length < 3 ||
                pediatrician.length > 100
            ) return { error: 'Name of pediatrician must be in the range of 3 to 100 chars' }
        }
        if (!phoneIsBlank) {
            if (!telephone.match(NUMERICAL) ||
                cleanExcessWhiteSpaces(telephone).length !== 10 ||
                parseInt(cleanExcessWhiteSpaces(telephone).charAt(0)) !== 0
            ) return { error: 'Telephone must be a numerical string of 10 chars, starting with 0' }
        }
        if (pediatricianIsBlank && !phoneIsBlank) return { error: 'Provide name of the pediatrician' }
        let incorrectDiseases = false
        for (let i = 0; i < previous_diseases.length; i++) {
            const item = previous_diseases[i]
            if (!item.match(CSVDOT_HYPHEN)) incorrectDiseases = true
        }
        if (incorrectDiseases) return { error: 'Unexpected characters found in previous diseases' }
        next()
    }
    const updateMedicalInfoValidator = (data, next) => {
        const { info_id, pediatrician, telephone, previous_diseases } = data
        if (!info_id.match(MONGOOBJECT)) return { error: 'Bad request' }
        const pediatricianIsBlank = cleanExcessWhiteSpaces(pediatrician).length === 0
        const phoneIsBlank = cleanExcessWhiteSpaces(telephone).length === 0
        if (!pediatricianIsBlank) {
            if (!pediatrician.match(ALPHA)) return { error: 'Name of pediatrician should only contain English alphabets and whitespaces' }
            if (pediatrician.length < 3 ||
                pediatrician.length > 100
            ) return { error: 'Name of pediatrician must be in the range of 3 to 100 chars' }
        }
        if (!phoneIsBlank) {
            if (!telephone.match(NUMERICAL) ||
                cleanExcessWhiteSpaces(telephone).length !== 10 ||
                parseInt(cleanExcessWhiteSpaces(telephone).charAt(0)) !== 0
            ) return { error: 'Telephone must be a numerical string of 10 chars, starting with 0' }
        }
        if (pediatricianIsBlank && !phoneIsBlank) return { error: 'Provide name of the pediatrician' }
        let incorrectDiseases = false
        for (let i = 0; i < previous_diseases.length; i++) {
            const item = previous_diseases[i]
            if (!item.match(CSVDOT_HYPHEN)) incorrectDiseases = true
        }
        if (incorrectDiseases) return { error: 'Unexpected characters found in previous diseases' }
        next()
    }
    return {
        createMedicalInfoValidator, updateMedicalInfoValidator
    }
}