import RequestBodyChecker from "../helpers/helper.request_checker.js"
import { Regex } from "../utils/static/index.js"

const useFeeValidator = (data, next) => {
  const { academic_year_id, term_id, fee_data, classes } = data

  const { isTrueBodyStructure } = RequestBodyChecker()

  if (typeof academic_year_id !== "string" || typeof term_id !== "string")
    return { error: "Selected term or academic year is not available" }

  let errorInClassesArray = false

  if (!Array.isArray(classes))
    return { error: "Provide list of classes to assign fee to" }

  const hasMatchRegex = classes.every((classId) =>
    Regex.MONGOOBJECT.test(classId)
  )
  if (!hasMatchRegex) errorInClassesArray = true

  if (term_id.length > 0) {
    if (!Regex.MONGOOBJECT.test(term_id))
      return { error: "Selected term is not available" }
  }

  if (!Regex.MONGOOBJECT.test(academic_year_id) || errorInClassesArray)
    return { error: "Cannot process an invalid dataset" }

  if (!Array.isArray(fee_data))
    return { error: "Provide the list of items that comprise the fee data" }

  if (fee_data.length === 0) return { error: "Provide list of fee items" }

  let hasPassedCorrectFeeDataKeys = true

  const expectedKeys = ["id", "item", "amount"]

  for (let i = 0; i < fee_data.length; i++) {
    const checkKeys = isTrueBodyStructure(fee_data[i], expectedKeys)

    if (!checkKeys) hasPassedCorrectFeeDataKeys = false

    if (!Regex.DECIMAL_NUM.test(fee_data[i].amount))
      hasPassedCorrectFeeDataKeys = false
  }

  if (!hasPassedCorrectFeeDataKeys)
    return { error: "Fee data Error: Provide (id, item, amount) in array" }

  next()
}

export default useFeeValidator
