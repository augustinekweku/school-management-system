import StringManipulators from '../utils/algos/StringManipulators.js'
import { Regex } from '../utils/static/index.js'

export default function SchoolFeesValidations() {
    const { MONGOOBJECT, CSVDOT_HYPHEN, DECIMAL_NUM } = Regex
    const { cleanText } = StringManipulators()
    const feeCreationValidator = (data, next) => {
        const { class_id, term_id, payments } = data
        if (!class_id.match(MONGOOBJECT) || !term_id.match(MONGOOBJECT)) return { error: 'Bad request' }
        const incorrectKeys = payments.filter(payment => !Object.keys(payment).includes('item') || !Object.keys(payment).includes('amount'))
        if (incorrectKeys.length > 0) return { error: 'Invalid data provided' }
        const inValidPaymentValues = payments.filter(item => (!item['item'].match(CSVDOT_HYPHEN) || !item['amount'].match(DECIMAL_NUM)))
        if (inValidPaymentValues.length > 0) return { error: 'Invalid data provided' }
        const emptyValues = payments.filter(item => (
            cleanText(item['item']).length < 3 || cleanText(item['amount']).length === 0
        ))
        if (emptyValues.length > 0) return { error: 'Invalid data provided. Empty fields or inappropriate fee items detected' }
        next()
    }

    return {
        feeCreationValidator
    }
}