import format from "pg-format"
import DatabaseConnection from "../../config/config.db.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import useFeeValidator from "../../validators/validator.fees.js"
import { ObjectId } from "bson"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"

const { pool } = DatabaseConnection()

// check the academic year and term correspondence
export const checkProvidedIds = async (year_id, term_id) => {
  try {
    const termDataQuery = `SELECT 
          t.school_id 
          FROM terms t INNER JOIN academic_years y 
          ON t.academic_year_id = y.id WHERE 
          t.is_displayable = $1 AND y.is_displayable = $1 
          AND t.academic_year_id = $2 AND t.id = $3
      `
    const yearDataQuery = `SELECT 
            school_id FROM academic_years WHERE 
            id = $1
      `
    const yearDataPromise = pool.query(yearDataQuery, [year_id])
    const termDataPromise =
      term_id.length === 0
        ? 0
        : pool.query(termDataQuery, [true, year_id, term_id])

    const [termData, yearData] = await Promise.all([
      termDataPromise,
      yearDataPromise,
    ])
    if (!yearData.rowCount) return null
    if (termDataPromise !== 0) {
      if (!termData.rowCount) return null
    }
    const schoolId = yearData.rows[0].school_id
    return schoolId
  } catch (error) {
    return null
  }
}

export const verifyClasses = async (classes, school_id) => {
  try {
    const query = format(
      `SELECT classname FROM classes WHERE id IN (%L) AND is_displayable = true AND school_id = '${school_id}'`,
      classes
    )
    const getData = await pool.query(query)
    if (getData.rowCount === 0 || getData.rowCount !== classes.length)
      return false // invalid class ids
    return true
  } catch (error) {
    return false
  }
}

// fee_data = ({id, item, amount})[]

export const findOccurrences = (dbClassesArrays, classesInRequest) => {
  const dbClassesMap = dbClassesArrays.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1
    return acc
  }, {})

  const occurrences = classesInRequest.reduce((acc, val) => {
    if (dbClassesMap[val] !== undefined) {
      acc[val] = (acc[val] || 0) + 1
    }
    return acc
  }, {})

  return occurrences
}

export const checkForClassOccurrenceInTermFees = (
  termId,
  feesArray,
  classes
) => {
  const termFees = feesArray.filter((fee) => fee.term_id === termId)
  if (termFees.length === 0) return false

  let classesWithTermFee = [] // all the classes that has this terms' fees
  let hasWasAssignedFee = false

  for (let i = 0; i < feesArray.length; i++) {
    classesWithTermFee = [...classesWithTermFee, ...feesArray[i].classes]
  }

  const occurrences = findOccurrences(classesWithTermFee, classes)

  for (const key in occurrences) {
    if (Object.hasOwnProperty.call(occurrences, key)) {
      if (occurrences[key] === 1) hasWasAssignedFee = true
    }
  }

  return hasWasAssignedFee
}

const checkExistence = async (year_id, term_id, classes) => {
  try {
    // exists = true exists already
    const existenceQuery = `SELECT 
            classes, term_id FROM fee_items 
            WHERE academic_year_id = $1 
            AND is_displayable = $2
        `
    const termsCounterPromise =
      term_id.length === 0
        ? 0
        : pool.query(
            `SELECT COUNT(id) AS terms_count FROM terms WHERE academic_year_id = $1`,
            [year_id]
          )
    const feeDataByYearIdPromise = pool.query(existenceQuery, [year_id, true])

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

const ConfigureFeeItems = async (req, res) => {
  const { isTrueBodyStructure } = RequestBodyChecker()
  const expected_payload = [
    "academic_year_id",
    "term_id",
    "fee_data",
    "classes",
  ]
  const checkPayload = isTrueBodyStructure(req.body, expected_payload)
  if (!checkPayload)
    return res
      .status(400)
      .json({ message: "Bad request", code: "400", data: {} })
  const payload = req.body

  const validate = useFeeValidator(payload, async () => {
    const { extract } = Eligibility_Extractor()

    try {
      const termCheck = await checkProvidedIds(
        payload.academic_year_id,
        payload.term_id
      )

      if (!termCheck)
        return res.status(412).json({
          message:
            "Selected term or academic year combination is not available",
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
          // Register the fee data here
          const id = new ObjectId().toString() // unique ID for the fee data

          const registrationPayload = {
            id,
            term_id: payload.term_id.length === 0 ? null : payload.term_id,
            academic_year_id: payload.academic_year_id,
            fee_data: payload.fee_data,
            classes: payload.classes,
            is_active: true,
            not_deleted: true,
          }

          const createQuery = `INSERT INTO
            fee_items (id, term_id, academic_year_id, fee_data, classes) 
            VALUES ($1, $2, $3, $4, $5) RETURNING id
          `

          await pool.query(createQuery, [
            id,
            payload.term_id.length === 0 ? null : payload.term_id,
            payload.academic_year_id,
            payload.fee_data,
            payload.classes,
          ])
          return res.status(201).json({
            message: "Fee data was created successfully",
            code: "201",
            data: { ...registrationPayload },
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
export default ConfigureFeeItems
