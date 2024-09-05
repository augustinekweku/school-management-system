import DatabaseConnection from "../config/config.db.js"
import RequestInformation from "../middlewares/middleware.request_info.js"
import SchoolQueries from "../queries/query.school.js"
import EligibilityChecker from "./helper.eligibility_checker.js"

export default function Eligibility_Extractor() {
  const { GETSCHOOLBYID } = SchoolQueries()
  const { pool } = DatabaseConnection()
  const extract = (school_id, req, res, next) => {
    const request_info = RequestInformation(req, res)
    pool
      .query(GETSCHOOLBYID, [school_id])
      .then((school) => {
        if (school.rowCount === 0)
          return res
            .status(404)
            .json({ message: "No school records found", code: "404", data: {} })
        const shouldContinue = EligibilityChecker().isEligible(
          school.rows[0],
          request_info
        )
        if (!shouldContinue)
          return res
            .status(412)
            .json({ message: "Access denied!", code: "412", data: {} })
        req.school_data = school.rows[0]
        req.authed_user_data = {
          user_id: request_info.user_id,
          usertype: request_info.usertype,
        }
        return next()
      })
      .catch((err) => {
        return res.status(500).json({
          message: "Whoops! Something went wrong",
          code: "500",
          data: {},
        })
      })
  }
  return { extract }
}
