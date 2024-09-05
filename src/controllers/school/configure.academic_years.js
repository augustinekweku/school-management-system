import url from "url"
import { ObjectId } from "bson"
import DatabaseConnection from "../../config/config.db.js"
import SchoolQueries from "../../queries/query.school.js"
import StringManipulators from "../../utils/algos/StringManipulators.js"
import { Messages, Regex } from "../../utils/static/index.js"
import SchoolValidators from "../../validators/validator.school.js"
import Pagination from "../../helpers/helper.pagination_setter.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import PaginationParams from "../../helpers/helper.paginator.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import DatabaseEngine from "../../helpers/helper.engine-db.js"

export default function ConfigureAcademicYears() {
  const { academicYearRegistrationValidation } = SchoolValidators(),
    { cleanText } = StringManipulators()
  const { pool } = DatabaseConnection(),
    { WSWW } = Messages.General
  const { extract } = Eligibility_Extractor()
  const { getPageParams, localPaginator } = PaginationParams()
  const { isTrueBodyStructure } = RequestBodyChecker()
  const { ExecuteSoftDelete } = DatabaseEngine()
  const {
    COUNT_TERM_YEAR_ASSOC_RESOURCE,
    SAVEYEAR,
    GETACADEMIC_YEARS,
    GETAYEAR,
    GETYEARSFORSEARCH,
    PAGINATED_ACADEMIC_YEARS,
    UPDATEACADEMIC_YEAR,
    DELETEACADEMIC_YEAR,
  } = SchoolQueries()
  const { MONGOOBJECT } = Regex

  const CheckExistence = async (school_id) => {
    try {
      const years = await pool.query(GETACADEMIC_YEARS, [school_id])
      return years
    } finally {
      console.log(true)
    }
  }

  const saveYear = async (res, yr_id, school_id, acad_year, timestamp) => {
    try {
      await pool.query(SAVEYEAR, [yr_id, school_id, acad_year, timestamp])
      return res.status(201).json({
        message: "Academic year created successfully",
        code: "201",
        data: {
          id: yr_id,
          school_id,
          acad_year,
          created_at: timestamp,
          updated_at: timestamp,
        },
      })
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }

  const registerAcademicYear = (req, res) => {
    let { school_id, acad_year } = req.body
    const expected_payload = ["school_id", "acad_year"]
    const checkPayload = isTrueBodyStructure(req.body, expected_payload)
    if (!checkPayload)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const validate = academicYearRegistrationValidation(req.body, () => {
      return extract(school_id, req, res, async () => {
        try {
          const yearParts = acad_year.split("-", 2)
          acad_year = `${parseInt(yearParts[0].trim())}-${parseInt(
            yearParts[1].trim()
          )}`
          const yr_id = new ObjectId().toString()
          const timestamp = new Date().toISOString()
          const years = await CheckExistence(school_id)
          if (years.rowCount === 0)
            return saveYear(res, yr_id, school_id, acad_year, timestamp)
          const yrData = years.rows
          let dataExists = false
          for (let i = 0; i < yrData.length; i++) {
            const item = yrData[i]
            if (item.acad_year === acad_year) dataExists = true
          }
          if (dataExists)
            return res.status(412).json({
              message: "Academic year already registered",
              code: "412",
              data: {},
            })
          return saveYear(res, yr_id, school_id, acad_year, timestamp)
        } catch (error) {
          return res.status(500).json({ message: WSWW, code: "500", data: {} })
        }
      })
    })
    if (validate !== undefined)
      return res
        .status(412)
        .json({ message: validate.error, code: "412", data: {} })
    return validate
  }
  const getAcademicYearsBySchool = async (req, res) => {
    try {
      const params = new URLSearchParams(url.parse(req.url, true).query)
      if (!params.get("school_id"))
        return res
          .status(400)
          .json({ message: "Bad request", code: "400", data: {} })
      const school_id = params.get("school_id")
      if (!school_id.match(MONGOOBJECT))
        return res
          .status(400)
          .json({ message: "Bad request", code: "400", data: {} })
      const { pageSize, offset, page } = Pagination().Setter(params, 1, 10)
      const paginationData = await getPageParams(
        pageSize,
        "academic_years",
        `school_id = '${school_id}' AND is_displayable = true`
      )
      const years = await pool.query(PAGINATED_ACADEMIC_YEARS, [
        school_id,
        true,
        pageSize,
        offset,
      ])
      return res.status(200).json({
        message: "",
        code: "200",
        data: {
          years: years.rows,
          page_data: {
            ...paginationData,
            currentPage: page,
            pageSize,
          },
        },
      })
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }
  const getAnAcademicYear = async (req, res) => {
    try {
      const param = new URLSearchParams(url.parse(req.url, true).query)
      if (!param.get("academic_year_id"))
        return res
          .status(400)
          .json({ message: "Bad request", code: "400", data: {} })
      const year_id = param.get("academic_year_id")
      if (!year_id.match(MONGOOBJECT))
        return res
          .status(400)
          .json({ message: "Bad request", code: "400", data: {} })
      const year = await pool.query(GETAYEAR, [year_id])
      if (year.rowCount !== 1)
        return res.status(200).json({ message: "", code: "200", data: {} })
      return res
        .status(200)
        .json({ message: "", code: "200", data: { ...year.rows[0] } })
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }
  const removeAcademicYear = (req, res) => {
    const param = new URLSearchParams(url.parse(req.url, true).query)
    if (!param.get("academic_year_id") || !param.get("school_id"))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const year_id = param.get("academic_year_id")
    const school_id = param.get("school_id")
    if (!year_id.match(MONGOOBJECT) || !school_id.match(MONGOOBJECT))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    return extract(school_id, req, res, async () => {
      try {
        const lookup = await pool.query(COUNT_TERM_YEAR_ASSOC_RESOURCE, [
          year_id,
        ])
        const counters = lookup.rows[0]
        const tSchool_id = counters.school_id
        if (tSchool_id !== school_id)
          return res
            .status(412)
            .json({ message: "Access denied!", code: "412", data: {} })
        if (parseInt(counters.resource_exists) === 0)
          return res
            .status(412)
            .json({ message: "No records found", code: "412", data: {} })
        if (parseInt(counters.resource_shared_with_terms) > 0)
          return ExecuteSoftDelete(res, year_id, "academic_years")
        await pool.query(DELETEACADEMIC_YEAR, [year_id])
        return res.status(200).json({
          message: "Record deleted successfully with all associated terms",
          code: "200",
          data: {},
        })
      } catch (error) {
        return res.status(500).json({ message: WSWW, code: "500", data: {} })
      }
    })
  }
  const updateAcademicYear = (req, res) => {
    let { acad_year_id, school_id, acad_year } = req.body
    const expected_payload = ["acad_year_id", "school_id", "acad_year"]
    const checkPayload = isTrueBodyStructure(req.body, expected_payload)
    if (!checkPayload)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    if (!acad_year_id.toString().match(MONGOOBJECT))
      return res
        .status(400)
        .json({ message: "Bad request received", code: "400", data: {} })
    const validate = academicYearRegistrationValidation(req.body, () => {
      return extract(school_id, req, res, async () => {
        try {
          const yearParts = acad_year.split("-", 2)
          const timestamp = new Date().toISOString()
          acad_year = `${parseInt(yearParts[0])}-${parseInt(yearParts[1])}`
          const years = await pool.query(GETACADEMIC_YEARS, [school_id])
          if (years.rowCount === 0)
            return res.status(404).json({
              message: "No academic year record found",
              code: "404",
              data: {},
            })
          const yrData = years.rows
          const thisYear = yrData.filter((item) => item.id === acad_year_id)
          if (thisYear.length === 0)
            return res
              .status(412)
              .json({ message: "No records found", code: "412", data: {} })
          if (!thisYear[0].is_displayable)
            return res.status(412).json({
              message: "Cannot update a hidden resource",
              code: "412",
              data: {},
            })
          let dataExists = false
          let noChangesFound = false
          for (let i = 0; i < yrData.length; i++) {
            const item = yrData[i]
            if (item.acad_year === acad_year && item.id !== acad_year_id)
              dataExists = true
            if (item.acad_year === acad_year && item.id === acad_year_id)
              noChangesFound = true
          }
          if (dataExists)
            return res.status(412).json({
              message:
                "Cannot update the targetted year with an already registered one",
              code: "412",
              data: {},
            })
          if (noChangesFound)
            return res
              .status(412)
              .json({ message: "No changes found yet", code: "412", data: {} })
          await pool.query(UPDATEACADEMIC_YEAR, [
            acad_year,
            timestamp,
            acad_year_id,
          ])
          return res.status(200).json({
            message: "Academic year update was successful",
            code: "200",
            data: {
              ...thisYear[0],
              row_id: undefined,
              acad_year,
              updated_at: timestamp,
            },
          })
        } catch (error) {
          return res.status(500).json({ message: WSWW, code: "500", data: {} })
        }
      })
    })
    if (validate !== undefined)
      return res
        .status(412)
        .json({ message: validate.error, code: "412", data: {} })
    return validate
  }
  const searchAcademicYear = (req, res) => {
    const params = new URLSearchParams(url.parse(req.url, true).query)
    if (!params.get("q") || !params.get("school_id"))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const q = cleanText(params.get("q")),
      school_id = params.get("school_id")
    if (!school_id.match(MONGOOBJECT))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    pool
      .query(GETYEARSFORSEARCH, [school_id, true])
      .then((years) => {
        if (years.rowCount === 0)
          return res.status(200).json({
            message: "No matching records found",
            code: "200",
            data: {},
          })
        const yrData = years.rows
        const lowercaseQ = q.toLowerCase()
        const results = yrData.filter((item) =>
          JSON.stringify(item.acad_year).toLowerCase().includes(lowercaseQ)
        )
        const { pageSize, page } = Pagination().Setter(params, 1, 10)
        const { total_pages, search_results, total_items } = localPaginator(
          results,
          pageSize,
          page
        )
        return res.status(200).json({
          message: "",
          code: "200",
          data: {
            years: [...search_results],
            page_data: {
              totalCount: total_items,
              totalPages: total_pages,
              currentPage: page,
              pageSize: pageSize,
            },
          },
        })
      })
      .catch((err) => {
        return res.status(500).json({ message: WSWW, code: "500", data: {} })
      })
  }

  return {
    getAcademicYearsBySchool,
    getAnAcademicYear,
    searchAcademicYear,
    updateAcademicYear,
    removeAcademicYear,
    registerAcademicYear,
  }
}
