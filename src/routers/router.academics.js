import express from "express"
import AcademicRecordController from "../controllers/academics/academics.records.js"
import TeacherMiddleware from "../middlewares/middleware.teacher.js"

const academicsRouter = express.Router()

const {
  getClassSubject,
  getRecords,
  resultEntry,
  deleteResult,
  filterResults,
} = AcademicRecordController()
academicsRouter.post("/", TeacherMiddleware, resultEntry)
academicsRouter.delete("/", TeacherMiddleware, deleteResult)
academicsRouter.get(
  "/classlist-and-subjects",
  TeacherMiddleware,
  getClassSubject
)
academicsRouter.get("/", TeacherMiddleware, getRecords)
academicsRouter.get("/filter", TeacherMiddleware, filterResults)

export default academicsRouter
