import express from 'express'
import SchoolControllers from '../controllers/controller.school.js'
import SchoolAdminMiddleware from '../middlewares/middleware.sch_admin.js'
import AccountControllers from '../controllers/controller.account.js'
import SuperAdminMiddleware from '../middlewares/middleware.super_admin.js'
import ConfigureBasicSchoolInformation from '../controllers/school/configure.basic.js'
import ConfigureClasses from '../controllers/school/configure.classes.js'
import ConfigureAcademicYears from '../controllers/school/configure.academic_years.js'
import ConfigureTerms from '../controllers/school/configure.terms.js'
import ConfigureSubjects from '../controllers/school/configure.subjects.js'

const schoolRoutes = express.Router()

const { schoolInformationConfig, updateLogo, getSchool } = ConfigureBasicSchoolInformation()
const { configureClasses, fetchClasses, deleteClass, clearAllClassesInSchool, searchClasses, updateClass } = ConfigureClasses()
const { getAcademicYearsBySchool, getAnAcademicYear, searchAcademicYear, updateAcademicYear,
    removeAcademicYear, registerAcademicYear } = ConfigureAcademicYears()
const { getSchools } = SchoolControllers()
const { saveTerms, updateTerm, removeTerm, fetchATerm, fetchTerms, filterTerms } = ConfigureTerms()
const { createSubject, updateSubject, getSubject, getSubjectsByClass, getSubjectsBySchool,
    searchSubjects, removeASubject, removeSubjectsByClass, removeSubjectsBySchool } = ConfigureSubjects()
const { removeSchoolData } = AccountControllers()

schoolRoutes.patch('/configure', SchoolAdminMiddleware, schoolInformationConfig)
schoolRoutes.patch('/configure/set-logo', SchoolAdminMiddleware, updateLogo)
schoolRoutes.get('/school', getSchool)
schoolRoutes.delete('/', SuperAdminMiddleware, removeSchoolData)
schoolRoutes.patch('/configure/classes', SchoolAdminMiddleware, configureClasses)
schoolRoutes.get('/classes', fetchClasses)
schoolRoutes.get('/classes/search', searchClasses)
schoolRoutes.patch('/classes', SchoolAdminMiddleware, updateClass)
schoolRoutes.delete('/classes', SchoolAdminMiddleware, deleteClass)
schoolRoutes.delete('/classes/school-classes', SchoolAdminMiddleware, clearAllClassesInSchool)

schoolRoutes.post('/academic_years', SchoolAdminMiddleware, registerAcademicYear)
schoolRoutes.get('/academic_years', getAcademicYearsBySchool)
schoolRoutes.get('/academic_years/year', getAnAcademicYear)
schoolRoutes.get('/academic_years/search', searchAcademicYear)
schoolRoutes.patch('/academic_years', SchoolAdminMiddleware, updateAcademicYear)
schoolRoutes.delete('/academic_years', SchoolAdminMiddleware, removeAcademicYear)
// schoolRoutes.delete('/academic_years/all', SchoolAdminMiddleware, removeAllAcademicYearsBySchool)

schoolRoutes.post('/terms', SchoolAdminMiddleware, saveTerms)
schoolRoutes.patch('/terms', SchoolAdminMiddleware, updateTerm)
schoolRoutes.delete('/terms', SchoolAdminMiddleware, removeTerm)
// schoolRoutes.delete('/terms/by-academic_year', SchoolAdminMiddleware, removeTermsUnderAcademicYear)
schoolRoutes.get('/terms/term', fetchATerm)
schoolRoutes.get('/terms', fetchTerms)
schoolRoutes.get('/terms/filter', filterTerms)

schoolRoutes.post('/subjects', SchoolAdminMiddleware, createSubject)
schoolRoutes.patch('/subjects', SchoolAdminMiddleware, updateSubject)
schoolRoutes.get('/subjects/subject', getSubject)
schoolRoutes.get('/subjects/by-class', getSubjectsByClass)
schoolRoutes.get('/subjects', getSubjectsBySchool)
schoolRoutes.get('/subjects/search', searchSubjects)
schoolRoutes.delete('/subjects', SchoolAdminMiddleware, removeASubject)
schoolRoutes.delete('/subjects/by-class', SchoolAdminMiddleware, removeSubjectsByClass)
schoolRoutes.delete('/subjects/by-school', SchoolAdminMiddleware, removeSubjectsBySchool)

schoolRoutes.get('/', getSchools) // temporary API

export default schoolRoutes