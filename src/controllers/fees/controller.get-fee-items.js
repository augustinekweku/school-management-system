import url from "url"
import { Regex } from "../../utils/static/index.js"
import DatabaseConnection from "../../config/config.db.js"

const { pool } = DatabaseConnection()

export const GetFeeItemsByAcademicYearId = async (req, res) => {
  try {
    const params = new URLSearchParams(url.parse(req.url, true).query)
    if (!params.get("academic_year_id"))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const yearId = params.get("academic_year_id")
    const termId = params.get("term_id")
    const classId = params.get("class_id")

    if (!Regex.MONGOOBJECT.test(yearId) || !Regex.MONGOOBJECT.test(classId))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })

    if (termId) {
      if (!Regex.MONGOOBJECT.test(termId))
        return res
          .status(400)
          .json({ message: "Bad request", code: "400", data: {} })
    }

    const getQuery = `SELECT 
            id, 
            academic_year_id,
            term_id,
            classes, 
            fee_data,
            is_active,
            is_displayable AS not_deleted FROM fee_items WHERE 
            academic_year_id = $1
        `
    const results = await pool.query(getQuery, [yearId])

    const filterBasedOnClass = results.rows.filter((row) =>
      row.classes.includes(classId)
    )

    const feeItems = !termId
      ? filterBasedOnClass
      : filterBasedOnClass.filter((row) => row.term_id === termId)
    return res
      .status(200)
      .json({ message: "", code: "200", data: { fee_items: feeItems } })
  } catch (error) {
    return res.status(500).json({
      message: "Whoops! Something went wrong",
      code: "500",
      data: {},
    })
  }
}
export const GetFeeItemsById = async (req, res) => {
  try {
    const params = new URLSearchParams(url.parse(req.url, true).query)
    if (!params.get("id"))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const id = params.get("id") // fee item id

    if (!Regex.MONGOOBJECT.test(id))
      return res
        .status(400)
        .json({ message: "Bad request ", code: "400", data: {} })

    const getQuery = `SELECT 
            id, 
            academic_year_id,
            term_id,
            classes, 
            fee_data,
            is_active,
            is_displayable AS not_deleted FROM fee_items WHERE 
            id = $1
        `
    const results = await pool.query(getQuery, [id])
    if (results.rowCount === 0)
      return res
        .status(200)
        .json({ message: "No records found", code: "200", data: {} })
    return res
      .status(200)
      .json({ message: "", code: "200", data: { fee_item: results.rows[0] } })
  } catch (error) {
    return res.status(500).json({
      message: "Whoops! Something went wrong",
      code: "500",
      data: {},
    })
  }
}
