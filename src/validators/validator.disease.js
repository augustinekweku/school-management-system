import StringManipulators from "../utils/algos/StringManipulators.js"
import { Regex } from "../utils/static/index.js"

export default function DiseaseValidations() {
    const { CSVDOT_HYPHEN, MONGOOBJECT } = Regex
    const { cleanExcessWhiteSpaces } = StringManipulators()
    const createDiseaseValidator = (data, next) => {
        const { disease, school_id } = data
        if (!school_id.match(MONGOOBJECT)) return { error: 'Bad request' }
        // if (!disease.match(CSVDOT_HYPHEN)) return { error: 'Unexpected chars found in disease field' }
        const formattedDisease = cleanExcessWhiteSpaces(disease)
        if (formattedDisease.length < 3 || formattedDisease.length > 50) return { error: 'Disease field must be in the range of 3 and 50 chars' }
        next()
    }
    const updateDiseaseValidator = (data, next) => {
        const { disease_id, disease } = data
        if (!disease_id.match(MONGOOBJECT)) return { error: 'Bad request' }
        // if (!disease.match(CSVDOT_HYPHEN)) return { error: 'Unexpected chars found in disease field' }
        const formattedDisease = cleanExcessWhiteSpaces(disease)
        if (formattedDisease.length < 3 || formattedDisease.length > 50) return { error: 'Disease field must be in the range of 3 and 50 chars' }
        next()
    }
    return {
        createDiseaseValidator, updateDiseaseValidator
    }
}