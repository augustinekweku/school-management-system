import format from "pg-format"
import DatabaseConnection from "../../../config/config.db.js"
import Eligibility_Extractor from "../../../helpers/helper.account_sch_relation.js"
import { Regex } from "../../../utils/static/index.js"
import url from "url"
import Pagination from "../../../helpers/helper.pagination_setter.js"
import PaginationParams from "../../../helpers/helper.paginator.js"
import {
  feeRecordQuery,
  fetchPaymentQuery,
} from "../../../queries/query.fees.js"

const { pool } = DatabaseConnection()

const StudentPaymentList = async (req, res) => {
  const params = new URLSearchParams(url.parse(req.url, true).query)
  if (!params.get("fee_id"))
    return res
      .status(400)
      .json({ message: "Bad request", code: "400", data: {} })
  try {
    const { localPaginator } = PaginationParams()
    const { extract } = Eligibility_Extractor()
    const feeId = params.get("fee_id")
    const classId = params.get("class_id") // class to view fees for (optional)
    if (!Regex.MONGOOBJECT.test(feeId))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })

    // get fee record by id

    const getFeeItemRecord = await pool.query(feeRecordQuery, [feeId, true])
    if (!getFeeItemRecord.rowCount)
      return res
        .status(412)
        .json({ message: "No records found", code: "412", data: {} })
    const feeRecord = getFeeItemRecord.rows[0]

    // get academic year and term data
    const academicYearPromise = pool.query(
      `SELECT school_id, acad_year FROM academic_years WHERE id = $1`,
      [feeRecord.academic_year_id]
    )
    const termPromise = !feeRecord.term_id
      ? null
      : pool.query(
          `SELECT name, start_date, end_date, school_id, is_next_term FROM terms WHERE id = $1`,
          [feeRecord.term_id]
        )
    const [yearData, termData] = await Promise.all([
      academicYearPromise,
      termPromise,
    ])
    if (!yearData.rowCount)
      return res
        .status(412)
        .json({ message: "No records found", code: "412", data: {} })
    const academicYearData = yearData.rows[0]
    const termRecord = !termData
      ? null
      : !termData.rowCount
      ? null
      : termData.rows[0]

    // check for year and term correspondence
    if (termRecord) {
      if (academicYearData.school_id !== termRecord.school_id)
        return res
          .status(412)
          .json({ message: "No records found", code: "412", data: {} })
    }

    // check school_id (extract)
    return extract(academicYearData.school_id, req, res, async () => {
      try {
        const classesArray = feeRecord.classes
        const query = format(
          `SELECT id, shortname, classname FROM classes WHERE id IN (%L) AND is_displayable = true AND school_id = '${academicYearData.school_id}'`,
          classesArray
        )
        const getClassesData = await pool.query(query)
        if (!getClassesData.rowCount)
          return res.status(200).json({ message: "", code: "200", data: {} })

        // check if the provided class id is in the classes list
        if (classId) {
          const dbClassesList = getClassesData.rows.map((row) => row.id)
          if (!dbClassesList.includes(classId))
            return res.status(200).json({
              message:
                "The selected class was not assigned to the selected fee item",
              code: "200",
              data: {},
            })
        }
        const targettedClassId = !classId ? getClassesData.rows[0].id : classId
        // get student list with fee data

        const getStudentPaymentList = await pool.query(fetchPaymentQuery, [
          targettedClassId,
          feeId,
        ])

        // calculate the total fee amount
        const feeItemsArray = feeRecord.fee_data
        let totalFeeAmount = 0
        for (let i = 0; i < feeItemsArray.length; i++) {
          const feeItem = feeItemsArray[i]
          totalFeeAmount = totalFeeAmount + Number(feeItem.amount)
        }

        totalFeeAmount = Number(totalFeeAmount.toFixed(2))

        let paginatableStudentPaymentList = getStudentPaymentList.rows

        const orderBy = params.get("order-by")
        const searchQuery = params.get("q")

        // check for ordering request
        if (orderBy) {
          if (["debt-free-first", "debt-free-last"].includes(orderBy)) {
            paginatableStudentPaymentList =
              orderBy === "debt-free-last"
                ? paginatableStudentPaymentList.sort((a, b) => {
                    const hasNotPaidA = a.amount_paid === null
                    const hasNotPaidB = b.amount_paid === null
                    if (hasNotPaidA !== hasNotPaidB) {
                      return hasNotPaidB - hasNotPaidA
                    }
                  })
                : paginatableStudentPaymentList.sort((a, b) => {
                    const hasNotPaidA =
                      a.amount_paid === null || Number(a.amount_paid) === 0
                    const hasNotPaidB =
                      b.amount_paid === null || Number(b.amount_paid) === 0
                    if (hasNotPaidA !== hasNotPaidB) {
                      return hasNotPaidB - hasNotPaidA
                    }
                  })
          }
        }

        if (searchQuery) {
          if (searchQuery.length > 0) {
            const q = searchQuery.toLowerCase()
            paginatableStudentPaymentList =
              paginatableStudentPaymentList.filter((row) =>
                JSON.stringify(row).toLowerCase().includes(q)
              )
          }
        }

        const { pageSize, page } = Pagination().Setter(params, 1, 10)
        const {
          total_pages,
          search_results: records,
          total_items,
        } = localPaginator(paginatableStudentPaymentList, pageSize, page)

        return res.status(200).json({
          message: "",
          code: "200",
          data: {
            records,
            total_amount: totalFeeAmount,
            page_data: {
              totalCount: total_items,
              totalPages: total_pages,
              currentPage: page,
              pageSize: pageSize,
            },
            classes: getClassesData.rows.map((row) => ({
              ...row,
              owns_displayed_list: row.id === targettedClassId,
            })),
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
    return res
      .status(500)
      .json({ message: "Whoops! Something went wrong", code: "500", data: {} })
  }
}
export default StudentPaymentList
