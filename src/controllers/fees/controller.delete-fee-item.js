import url from "url"
import DatabaseConnection from "../../config/config.db.js"
import DatabaseEngine from "../../helpers/helper.engine-db.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import { Regex } from "../../utils/static/index.js"

const { pool } = DatabaseConnection()

const DeleteFeeItem = async (req, res) => {
  const { ExecuteSoftDelete } = DatabaseEngine()
  const { extract } = Eligibility_Extractor()
  try {
    const params = new URLSearchParams(url.parse(req.url, true).query)
    if (!params.get("id") || !params.get("school_id"))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const id = params.get("id") // fee item id
    const schoolId = params.get("school_id")

    if (!Regex.MONGOOBJECT.test(id))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })

    return extract(schoolId, req, res, async () => {
      try {
        const checkItemOwnershipQuery = `SELECT 
          f.id, 
          y.id AS academic_year_id 
          FROM fee_items f INNER JOIN academic_years y 
          ON f.academic_year_id = y.id WHERE y.school_id = $1 
          AND f.id = $2
        `
        const itemOwnership = await pool.query(checkItemOwnershipQuery, [
          schoolId,
          id,
        ])
        if (!itemOwnership.rowCount)
          return res.status(412).json({
            message: "Item does not belong to your school",
            code: "412",
            data: {},
          })
        // check if item has been paid by students
        const paymentCountQuery = `SELECT COUNT (id) AS payment_count FROM fee_payment_history WHERE fee_id = $1`
        const countPayments = await pool.query(paymentCountQuery, [id])
        const count = countPayments.rows[0].payment_count
        if (count > 0) return ExecuteSoftDelete(res, id, "fee_items")
        //  delete item here
        const deleteQuery = `DELETE FROM fee_items WHERE id = $1`
        await pool.query(deleteQuery, [id])
        return res.status(200).json({
          message: "Fee item was deleted successfully",
          code: "200",
          data: {},
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
}
export default DeleteFeeItem
