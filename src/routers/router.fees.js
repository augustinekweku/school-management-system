import express from "express"
import SchoolAdminMiddleware from "../middlewares/middleware.sch_admin.js"
import ConfigureFeeItems from "../controllers/fees/controller.configure-fees-items.js"
import UpdateFeeItems from "../controllers/fees/controller.update-fee-items.js"
import {
  GetFeeItemsByAcademicYearId,
  GetFeeItemsById,
} from "../controllers/fees/controller.get-fee-items.js"
import DeleteFeeItem from "../controllers/fees/controller.delete-fee-item.js"
import StudentPaymentList from "../controllers/fees/payments/controller.student-list.js"
import StudentFeePayment from "../controllers/fees/payments/controller.pay-fee.js"
import AccountantMiddleware from "../middlewares/middleware.accountant.js"

const feesRouter = express.Router()

feesRouter.post("/", AccountantMiddleware, ConfigureFeeItems)
feesRouter.patch("/", AccountantMiddleware, UpdateFeeItems)
feesRouter.get(
  "/get-by-year",
  // AccountantMiddleware,
  GetFeeItemsByAcademicYearId
)
feesRouter.get("/get-by-id", AccountantMiddleware, GetFeeItemsById)
feesRouter.delete("/", AccountantMiddleware, DeleteFeeItem)

// payment history apis
feesRouter.get("/payment-history", AccountantMiddleware, StudentPaymentList)
feesRouter.post("/save-payment", AccountantMiddleware, StudentFeePayment)

export default feesRouter
