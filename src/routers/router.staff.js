import express from 'express'
import StaffConfigurations from '../controllers/staff/staff.configure.js'
import SchoolAdminMiddleware from '../middlewares/middleware.sch_admin.js'

const staffRouter = express.Router()

const { createStaff, updateStaff, fetchStaff, fetchStaffMember, searchStaff, deleteStaff, dataCounter } = StaffConfigurations()

staffRouter.post('/', SchoolAdminMiddleware, createStaff)
staffRouter.patch('/', SchoolAdminMiddleware, updateStaff)
staffRouter.delete('/', SchoolAdminMiddleware, deleteStaff)
staffRouter.get('/list', fetchStaff)
staffRouter.get('/', fetchStaffMember)
staffRouter.get('/search', searchStaff)
staffRouter.get('/count', dataCounter)

export default staffRouter