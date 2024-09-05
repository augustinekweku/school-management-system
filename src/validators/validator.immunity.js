import { Regex } from "../utils/static/index.js"
import moment from "moment"


export default function StudentImmunityValidations() {
    const { MONGOOBJECT } = Regex
    const createImmunityValidator = (data, next) => {
        const { disease_id, student_id, date } = data
        if (!disease_id.match(MONGOOBJECT) ||
            !student_id.match(MONGOOBJECT)
        ) return { error: 'Bad request' }
        const isValidDate = moment(date, true).isValid()
        const isPastDate = moment((new Date(date.split('T')[0])).toISOString()).isSameOrBefore(moment((new Date()).toISOString()))
        if (!isValidDate) return { error: 'Incorrect date chosen' }
        if (!isPastDate) return { error: 'Incorrect date chosen' }
        next()
    }

    return {
        createImmunityValidator
    }
}