import DatabaseConnection from "../../config/config.db.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import { Regex } from "../../utils/static/index.js"
import useFeeValidator from "../../validators/validator.fees.js"
import {
  checkForClassOccurrenceInTermFees,
  checkProvidedIds,
  findOccurrences,
  verifyClasses,
} from "./controller.configure-fees-items.js"

const { pool } = DatabaseConnection()

// retrieve fee item
const checkFeeItemById = async (id) => {
  try {
    const query = `SELECT 
            id, 
            academic_year_id,
            term_id,
            classes, 
            fee_data,
            is_active,
            is_displayable AS not_deleted FROM fee_items WHERE 
            id = $1 AND is_displayable = $2
        `
    const feeItemData = await pool.query(query, [id, true])
    if (feeItemData.rowCount === 0) return null
    return feeItemData.rows[0]
  } catch (error) {
    return null
  }
}

const checkExistence = async (id, year_id, term_id, classes) => {
  try {
    // exists = true exists already
    const existenceQuery = `SELECT 
            id, classes, term_id FROM fee_items 
            WHERE academic_year_id = $1
        `
    const termsCounterPromise =
      term_id.length === 0
        ? 0
        : pool.query(
            `SELECT COUNT(id) AS terms_count FROM terms WHERE academic_year_id = $1`,
            [year_id]
          )
    const feeDataByYearIdPromise = pool.query(existenceQuery, [year_id])

    const [termsCounter, feeDataByYearId] = await Promise.all([
      termsCounterPromise,
      feeDataByYearIdPromise,
    ])

    if (feeDataByYearId.rowCount === 0) return false

    const termsCounts =
      term_id.length === 0 ? 1 : Number(termsCounter.rows[0].terms_count)

    const dataArray = feeDataByYearId.rows

    const checkClassInTermFee = checkForClassOccurrenceInTermFees(
      term_id,
      dataArray,
      classes
    ) // check if classes in request already have fee based on the provided termId
    if (checkClassInTermFee) return true

    let classesArray = []

    for (let i = 0; i < dataArray.length; i++) {
      classesArray = [...classesArray, ...dataArray[i].classes]
    }

    const occurrences = findOccurrences(classesArray, classes)

    let hasReachedMaxFeeAssignment = false

    for (const key in occurrences) {
      if (Object.hasOwnProperty.call(occurrences, key)) {
        if (occurrences[key] === termsCounts) hasReachedMaxFeeAssignment = true
      }
    }

    return hasReachedMaxFeeAssignment
  } catch (error) {
    return true
  }
}

const UpdateFeeItems = async (req, res) => {
  const { isTrueBodyStructure } = RequestBodyChecker()
  const expected_payload = [
    "id",
    "academic_year_id",
    "term_id",
    "fee_data",
    "classes",
    "is_active",
  ]
  const checkPayload = isTrueBodyStructure(req.body, expected_payload)
  if (!checkPayload)
    return res
      .status(400)
      .json({ message: "Bad request", code: "400", data: {} })
  const payload = req.body
  if (typeof payload.is_active !== "boolean" || typeof payload.id !== "string")
    return res.status(412).json({
      message: "The value for fee item status is missing",
      code: "412",
      data: {},
    })
  if (!Regex.MONGOOBJECT.test(payload.id))
    return res
      .status(400)
      .json({ message: "Bad request", code: "400", data: {} })
  const validate = useFeeValidator(payload, async () => {
    const { extract } = Eligibility_Extractor()
    try {
      const [termCheck, checkFeeDataById] = await Promise.all([
        checkProvidedIds(payload.academic_year_id, payload.term_id),
        checkFeeItemById(payload.id),
      ])

      if (!checkFeeDataById)
        return res
          .status(412)
          .json({ message: "No records found", code: "412", data: {} })

      if (!termCheck)
        return res.status(412).json({
          message: "Selected term or academic year is not available",
          code: "412",
          data: {},
        })

      const schoolId = termCheck

      const classCheck = await verifyClasses(payload.classes, schoolId)

      if (!classCheck)
        return res.status(412).json({
          message: "Selected classes are not available",
          code: "412",
          data: {},
        })

      return extract(schoolId, req, res, async () => {
        try {
          // check existence
          const classMaxFeeAssignment = await checkExistence(
            payload.academic_year_id,
            payload.term_id,
            payload.classes
          )

          if (classMaxFeeAssignment)
            return res.status(412).json({
              message:
                "Selected class(es) has already been assigned max. number of fees under the provided academic year",
              code: "412",
              data: {},
            })

          const updatePayload = {
            id: payload.id,
            term_id: payload.term_id.length === 0 ? null : payload.term_id,
            academic_year_id: payload.academic_year_id,
            fee_data: payload.fee_data,
            classes: payload.classes,
            is_active: payload.is_active,
          }

          const updateFeeQuery = `UPDATE fee_items SET 
              term_id = $1, academic_year_id = $2, fee_data = $3, 
              classes = $4, is_active = $5 WHERE id = $6 
              RETURNING id
            `

          await pool.query(updateFeeQuery, [
            payload.term_id.length === 0 ? null : payload.term_id,
            payload.academic_year_id,
            payload.fee_data,
            payload.classes,
            payload.is_active,
            payload.id,
          ])

          return res.status(200).json({
            message: "Fee data was updated successfully",
            code: "200",
            data: {
              ...updatePayload,
              not_deleted: checkFeeDataById.not_deleted,
            },
          })
        } catch (error) {
          return res.status(500).json({
            message: "Whoops! Something went wrong",
            code: "500",
            data: {},
          })
        }
      })
    } catch (error) {
      return res.status(500).json({
        message: "Whoops! Something went wrong",
        code: "500",
        data: {},
      })
    }
  })
  if (validate !== undefined)
    return res
      .status(412)
      .json({ message: validate.error, code: "412", data: {} })
}
export default UpdateFeeItems
