import express from "express"
import ImmunizableDiseases from "../controllers/immunizable_diseases/diseases.js"
import SchoolAdminMiddleware from "../middlewares/middleware.sch_admin.js"

const diseaseRouter = express.Router()

const { createDisease, updateDisease, removeDisease, getDisease, getDiseases, searchDiseases } = ImmunizableDiseases()

diseaseRouter.post('/', SchoolAdminMiddleware, createDisease)
diseaseRouter.patch('/', SchoolAdminMiddleware, updateDisease)
diseaseRouter.delete('/', SchoolAdminMiddleware, removeDisease)
diseaseRouter.get('/', getDisease)
diseaseRouter.get('/list', getDiseases)
diseaseRouter.get('/search', searchDiseases)

export default diseaseRouter