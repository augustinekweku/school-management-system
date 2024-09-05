import express from 'express'
import UserControllers from '../controllers/controller.auth.js'
import AccountControllers from '../controllers/controller.account.js'
import SchoolAdminMiddleware from '../middlewares/middleware.sch_admin.js'
import AdminManagementController from '../controllers/users/controller.users.admins.js'
import SuperAdminMiddleware from '../middlewares/middleware.super_admin.js'
import UserAccountControllers from '../controllers/super_admin/controller.users.js'

const userRouter = express.Router()
const { createAccount, resendLink, accountVerification, passwordRecovery, passwordReset, s2Login, s1Login, resendLoginOTP, verifyAuth } = UserControllers()
const { revokeAccount, userUpdate } = AccountControllers()
const { createAdmin, getAdmins, updateAdmin, deleteAdmin } = AdminManagementController()
const superAdminControllers = UserAccountControllers()

userRouter.post('/', createAccount)
userRouter.post('/resend-link', resendLink)
userRouter.patch('/verify', accountVerification)
userRouter.post('/password-recovery', passwordRecovery)
userRouter.patch('/password-reset', passwordReset)
userRouter.post('/login/step/1', s1Login)
userRouter.post('/login/otp-request', resendLoginOTP)
userRouter.post('/login/step/2', s2Login)
userRouter.delete('/', revokeAccount) // UserMiddleware
userRouter.patch('/', userUpdate) // SuperAdminMiddleware
userRouter.get('/check-auth', verifyAuth)

userRouter.post('/manage_admins', SchoolAdminMiddleware, createAdmin)
userRouter.patch('/manage_admins', SchoolAdminMiddleware, updateAdmin)
userRouter.delete('/manage_admins', SchoolAdminMiddleware, deleteAdmin)
userRouter.get('/manage_admins', getAdmins)

userRouter.get('/super_admin', superAdminControllers.getUsers)
userRouter.get('/super_admin/user', superAdminControllers.getUser)
userRouter.patch('/super_admin', SuperAdminMiddleware, superAdminControllers.updateUser)
userRouter.get('/super_admin/search', superAdminControllers.searchUsers)
export default userRouter