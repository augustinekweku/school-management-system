import express from 'express'
import StudentsBasicInformation from '../controllers/student/student.basic.js'
import ConfigureParents from '../controllers/student/student.parent.js'
import EmergencyContactsConfigurations from '../controllers/student/student.e_contacts.js'
import StudentMedicalInformation from '../controllers/student/student.medical_info.js'
import StudentImmunityRecords from '../controllers/student/student.immunity.js'
import StudentMedicalReport from '../controllers/student/student.medical_report.js'
import SchoolAdminMiddleware from '../middlewares/middleware.sch_admin.js'
import StudentAccessControllers from '../controllers/users/controller.student_access.js'
import StudentMiddleware from '../middlewares/middleware.student.js'
import StudentPortalControllers from '../controllers/student/student.portal.js'

const studentRoute = express.Router()

const { createStudent, getStudents, getStudent, getTotalStudentsPerSchool, updateStudent, deleteStudent, searchStudents } = StudentsBasicInformation()
const { createParent, searchRelatedParents, updateParent, getParent, getParentsOfStudent, deleteParent } = ConfigureParents()
const { searchRelatedContactPersons, createContacts, updateContact, getContactPerson, getContactPersonsOfStudent, deleteContactPerson } = EmergencyContactsConfigurations()
const { createMedicalInformation, updateMedicalInformation, getMedicalInformation, removeMedicalInformation } = StudentMedicalInformation()
const { createImmunityRecord, deleteImmunityRecord, getImmunizationRecords, getImmunityRecord } = StudentImmunityRecords()
const { createReport, updateReport, getReport, deleteReport } = StudentMedicalReport()
const { login } = StudentAccessControllers()
const portalControllers = StudentPortalControllers()

studentRoute.post('/', SchoolAdminMiddleware, createStudent)
studentRoute.patch('/', SchoolAdminMiddleware, updateStudent)
studentRoute.delete('/', SchoolAdminMiddleware, deleteStudent)
studentRoute.get('/', getStudents)
studentRoute.get('/student', getStudent)
studentRoute.get('/count', getTotalStudentsPerSchool)
studentRoute.get('/search', searchStudents)

studentRoute.post('/parents', SchoolAdminMiddleware, createParent)
studentRoute.patch('/parents', SchoolAdminMiddleware, updateParent)
studentRoute.delete('/parents', SchoolAdminMiddleware, deleteParent)
studentRoute.get('/parents/search', searchRelatedParents)
studentRoute.get('/parents', getParent)
studentRoute.get('/parents/children', getParentsOfStudent)

studentRoute.post('/contacts', SchoolAdminMiddleware, createContacts)
studentRoute.patch('/contacts', SchoolAdminMiddleware, updateContact)
studentRoute.delete('/contacts', SchoolAdminMiddleware, deleteContactPerson)
studentRoute.get('/contacts/search', searchRelatedContactPersons)
studentRoute.get('/contacts', getContactPerson)
studentRoute.get('/contacts/list', getContactPersonsOfStudent)

studentRoute.post('/medical/information', SchoolAdminMiddleware, createMedicalInformation)
studentRoute.patch('/medical/information', SchoolAdminMiddleware, updateMedicalInformation)
studentRoute.delete('/medical/information', SchoolAdminMiddleware, removeMedicalInformation)
studentRoute.get('/medical/information', getMedicalInformation)

studentRoute.post('/immunization', SchoolAdminMiddleware, createImmunityRecord)
studentRoute.delete('/immunization', SchoolAdminMiddleware, deleteImmunityRecord)
studentRoute.get('/immunization', getImmunizationRecords)
studentRoute.get('/immunization/record', getImmunityRecord)

studentRoute.post('/medical/report', SchoolAdminMiddleware, createReport)
studentRoute.patch('/medical/report', SchoolAdminMiddleware, updateReport)
studentRoute.delete('/medical/report', SchoolAdminMiddleware, deleteReport)
studentRoute.get('/medical/report', getReport)

studentRoute.post('/login', login)

studentRoute.get('/portal', StudentMiddleware, portalControllers.getStudentInformation)
studentRoute.patch('/portal/account-settings', StudentMiddleware, portalControllers.studentAccountSetting)
studentRoute.get('/portal/result-list', StudentMiddleware, portalControllers.fetchResult)

export default studentRoute