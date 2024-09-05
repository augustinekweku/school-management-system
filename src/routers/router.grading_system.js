import express from "express"
import GradingSystemConfiguration from "../controllers/school/configure.grading_system.js"
import SchoolAdminMiddleware from "../middlewares/middleware.sch_admin.js"

const gradingSystemRouter = express.Router()

const { createGradingSystem, fetchGradingSystem, removeGradingSystem } = GradingSystemConfiguration()

gradingSystemRouter.post('/', SchoolAdminMiddleware, createGradingSystem)
gradingSystemRouter.get('/', fetchGradingSystem)
gradingSystemRouter.delete('/', SchoolAdminMiddleware, removeGradingSystem)

export default gradingSystemRouter