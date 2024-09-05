import format from "pg-format"
import DatabaseConnection from "../../config/config.db.js"
import RequestInformation from "../../middlewares/middleware.request_info.js"
import AcademicRecordQuery from "../../queries/query.academics_records.js"
import url from "url"
import { Regex } from "../../utils/static/index.js"
import Pagination from "../../helpers/helper.pagination_setter.js"
import PaginationParams from "../../helpers/helper.paginator.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import StringManipulators from "../../utils/algos/StringManipulators.js"
import Eligibility_Checker from "../../helpers/helper.account_sch_relation.js"
import AcademicsValidations from "../../validators/validator.academics.js"
import { ObjectId } from "bson"

export default function AcademicRecordController() {
  const WSWW = "Whoops! Something went wrong"
  const { pool } = DatabaseConnection()
  const {
    GETSCHOOLBYUSER,
    GETADMINREQUIREMENT,
    GETSTAFF,
    GETGRADINGSYSTEM,
    GETSPLITPERCENTAGE,
    GETSCHOOLBYCLASS,
    GETCLASSANDSUBJECTCORRELATION,
    GETSTUDENTSINCLASS,
    GETEXISTINGRECORD,
    SAVERECORD,
    GETRESULT,
    UPDATERECORD,
    GETSTUDENTANDSUBJECTCORRELATION,
    GETACTIVETERM,
    GETSCHFORVERIFICATION,
    GETSCHBYRESULTID,
    REMOVERECORD,
    CHECKRESULTEXISTENCE,
    GETTERMLIST,
  } = AcademicRecordQuery()
  const { MONGOOBJECT } = Regex
  const { getPageParams, localPaginator } = PaginationParams()
  const { isTrueBodyStructure } = RequestBodyChecker()
  const { cleanExcessWhiteSpaces } = StringManipulators()
  const { extract } = Eligibility_Checker()
  const { resultEntryValidator } = AcademicsValidations()

  const RetrieveUserOnRequest = (req, res) => {
    const request_info = RequestInformation(req, res)
    const authObjKeys = Object.keys(request_info)
    if (!authObjKeys.includes("user_id") || !authObjKeys.includes("usertype"))
      return null
    return {
      user_id: request_info.user_id,
      usertype: request_info.usertype,
    }
  }

  const PrepareTerms = (array) => {
    if (array.length === 0) return []
    let years = array.map(({ name, id, ...rest }) => rest)
    years = [...new Map(years.map((yr) => [yr.academic_year_id, yr])).values()]
    const prepared_data = years.map((year) => {
      const terms = array.filter(
        (ar) => ar.academic_year_id === year.academic_year_id
      )
      return {
        academic_year_id: year.academic_year_id,
        academic_year: year.acad_year,
        terms: [
          ...terms.map(({ academic_year_id, acad_year, ...rest }) => rest),
        ],
      }
    })
    return prepared_data
  }

  const GetAdminData = async (user_id) => {
    let classes = []
    let subjects = []
    let terms = []
    try {
      const getSchoolId = await pool.query(GETSCHOOLBYUSER, [user_id])
      if (getSchoolId.rowCount === 0) return { classes, subjects, terms }
      const schoolId = getSchoolId.rows[0].school_id
      const class_subject_data = await pool.query(GETADMINREQUIREMENT, [
        schoolId,
      ])
      const getTerms = await pool.query(GETTERMLIST, [schoolId])
      terms = PrepareTerms(getTerms.rows)
      if (class_subject_data.rowCount === 0) return { classes, subjects, terms }
      const resultRows = class_subject_data.rows
      const classArray = resultRows.map(
        ({ subject_id, subject_code, subject_name, ...rest }) => rest
      )
      classes = [...new Map(classArray.map((c) => [c.class_id, c])).values()]
      subjects = resultRows.map(({ classname, shortname, ...rest }) => rest)
      return {
        classes,
        subjects,
        terms,
      }
    } finally {
      console.log(true)
    }
  }

  const GetStaffData = async (user_id) => {
    let classes = []
    let subjects = []
    let terms = []
    try {
      const staff = await pool.query(GETSTAFF, [user_id])
      if (staff.rowCount === 0) return { classes, subjects, terms }
      const staffData = staff.rows[0]
      if (staffData.staff_type.toLowerCase() === "non-academic")
        return { classes, subjects, terms }
      const subject_list = info.accessible_subjects
      if (subject_list.length === 0) return { classes, subjects, terms }
      const GetClassSubjectQuery = format(
        `SELECT c.classname, c.shortname, c.id AS class_id, s.subject_name, s.subject_code, s.id AS subject_id FROM subjects s INNER JOIN classes c ON s.class_id = c.id WHERE s.id IN (%L)`,
        subject_list
      )
      const subjectClassResult = await pool.query(GetClassSubjectQuery)
      const getTerms = await pool.query(GETTERMLIST, [staffData.school_id])
      terms = PrepareTerms(getTerms.rows)
      if (subjectClassResult.rowCount === 0) return { classes, subjects, terms }
      const resultRows = class_subject_data.rows
      const classArray = resultRows.map(
        ({ subject_id, subject_code, subject_name, ...rest }) => rest
      )
      classes = [...new Map(classArray.map((c) => [c.class_id, c])).values()]
      subjects = resultRows.map(({ classname, shortname, ...rest }) => rest)
      return {
        classes,
        subjects,
        terms,
      }
    } finally {
      console.log(true)
    }
  }

  const getClassSubject = async (req, res) => {
    const returnedObj = {
      classes: [],
      subjects: [],
      terms: [],
    }
    try {
      const userOnRequest = RetrieveUserOnRequest(req, res)
      if (!userOnRequest)
        return res.status(200).json({
          message: "Authentication required",
          code: "200",
          data: { ...returnedObj },
        })
      const { user_id, usertype } = userOnRequest
      const data =
        usertype === parseInt(process.env.SMS_ADMIN) ||
        usertype === parseInt(process.env.SMS_SUPER_ADMIN)
          ? await GetAdminData(user_id)
          : await GetStaffData(user_id)
      return res.status(200).json({
        message: "",
        code: "200",
        data: {
          ...returnedObj,
          classes: data.classes,
          subjects: data.subjects,
          terms: data.terms,
        },
      })
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }

  const GetResultForAdmin = async (subject_id, term_id, studentIds) => {
    try {
      const formatQuery = format("%L", studentIds)
      const Query = `SELECT id, student_id, class_score_num, class_score_denom, exam_score_num, exam_score_denom, feedback, created_at, updated_at
            FROM academic_records WHERE student_id IN (${formatQuery}) AND 
            term_id = '${term_id}' AND subject_id = '${subject_id}'`
      const result = await pool.query(Query)
      return result.rows
    } finally {
      console.log(true)
    }
  }

  const GetResultForTeacher = async (
    user_id,
    subject_id,
    term_id,
    studentIds
  ) => {
    let data = []
    try {
      const staffData = await pool.query(GETSTAFF, [user_id])
      if (staffData.rowCount === 0) return data
      const { accessible_subjects } = staffData.rows[0]
      if (accessible_subjects.length === 0) return data
      if (!accessible_subjects.includes(subject_id)) return data
      data = await GetResultForAdmin(subject_id, term_id, studentIds)
      return data
    } finally {
      console.log(true)
    }
  }

  const ResultsCalculator = (data, grading_system, split_percentage) => {
    const { total_class_score, total_exam_score } = split_percentage
    let finalRecords = []
    for (let i = 0; i < data.length; i++) {
      const record = data[i]
      const class_score_num = parseFloat(
        parseFloat(record.class_score_num).toFixed(1)
      )
      const class_score_denom = parseFloat(
        parseFloat(record.class_score_denom).toFixed(1)
      )
      const exam_score_num = parseFloat(
        parseFloat(record.exam_score_num).toFixed(1)
      )
      const exam_score_denom = parseFloat(
        parseFloat(record.exam_score_denom).toFixed(1)
      )

      const classScore =
        (class_score_num / class_score_denom) * total_class_score || 0
      const examScore =
        (exam_score_num / exam_score_denom) * total_exam_score || 0
      const totalScore = Math.floor(classScore + examScore)
      let grade =
        grading_system.filter(
          (grade) =>
            totalScore >= grade.lowest_mark && totalScore <= grade.highest_mark
        )[0].grade || "n/a"
      let remark =
        grading_system.filter(
          (grade) =>
            totalScore >= grade.lowest_mark && totalScore <= grade.highest_mark
        )[0].remark || "n/a"
      finalRecords = [
        ...finalRecords,
        {
          ...record,
          class_score: Number(classScore.toFixed(1)),
          exam_score: Number(examScore.toFixed(1)),
          total_score: Number((classScore + examScore).toFixed(0)),
          grade,
          remark,
          class_score_num,
          class_score_denom,
          exam_score_num,
          exam_score_denom,
        },
      ]
    }
    return finalRecords
  }

  const getRecords = async (req, res) => {
    try {
      const params = new URLSearchParams(url.parse(req.url, true).query)
      if (
        !params.get("class_id") ||
        !params.get("subject_id") ||
        !params.get("term_id")
      )
        return res
          .status(400)
          .json({ message: "Bad request", code: "400", data: {} })
      const class_id = params.get("class_id")
      const subject_id = params.get("subject_id")
      const term_id = params.get("term_id")
      const returnedObj = { results: [] }
      if (
        !class_id.match(MONGOOBJECT) ||
        !subject_id.match(MONGOOBJECT) ||
        !term_id.match(MONGOOBJECT)
      )
        return res
          .status(400)
          .json({ message: "Bad request", code: "400", data: {} })
      const userOnRequest = RetrieveUserOnRequest(req, res)
      if (!userOnRequest)
        return res.status(200).json({
          message: "Authentication required",
          code: "200",
          data: { ...returnedObj },
        })
      const { user_id, usertype } = userOnRequest
      const getSchoolId = await pool.query(GETSCHOOLBYUSER, [user_id])
      if (getSchoolId.rowCount === 0)
        return res.status(200).json({
          message: "No records found",
          code: "200",
          data: { ...returnedObj },
        })
      const schoolId = getSchoolId.rows[0].school_id
      const getSchoolIdFromClass = await pool.query(GETSCHOOLBYCLASS, [
        class_id,
      ])
      if (getSchoolIdFromClass.rowCount === 0)
        return res
          .status(200)
          .json({ message: "No class records found", code: "200", data: {} })
      if (getSchoolIdFromClass.rows[0].school_id !== schoolId)
        return res.status(200).json({
          message: "Cannot access the requested data",
          code: "200",
          data: { ...returnedObj },
        })
      // Check for the existence of the subject on the class
      const checkSubjectClassCorrelation = await pool.query(
        GETCLASSANDSUBJECTCORRELATION,
        [subject_id, class_id]
      )
      if (parseInt(checkSubjectClassCorrelation.rows[0].class_has_subj) === 0)
        return res.status(200).json({
          message: "Selected subject does not belong to the class",
          code: "200",
          data: { ...returnedObj },
        })
      // Require list of students in the class
      const { pageSize, offset, page } = Pagination().Setter(params, 1, 10)
      const { totalCount, totalPages } = await getPageParams(
        pageSize,
        "students",
        `current_class = '${class_id}'`
      )
      if (totalCount === 0)
        return res.status(200).json({
          message: "No students found in the selected class",
          code: "200",
          data: { ...returnedObj },
        })
      const studentList = await pool.query(GETSTUDENTSINCLASS, [
        class_id,
        pageSize,
        offset,
      ])
      if (studentList.rowCount === 0)
        return res.status(200).json({
          message: "No students found on the requested page",
          code: "200",
          data: { ...returnedObj },
        })
      const studentsArray = studentList.rows
      const studentIds = [
        ...new Set(studentsArray.map((student) => student.id)),
      ]
      const resultData =
        usertype === parseInt(process.env.SMS_ADMIN) ||
        usertype === parseInt(process.env.SMS_SUPER_ADMIN)
          ? await GetResultForAdmin(subject_id, term_id, studentIds)
          : usertype === parseInt(process.env.SMS_TEACHER)
          ? await GetResultForTeacher(user_id, subject_id, term_id, studentIds)
          : null
      if (!resultData)
        return res.status(200).json({
          message: "Access denied",
          code: "200",
          data: { ...returnedObj },
        })
      // Get grading system and split percentage of the school
      const gradingSystem = await pool.query(GETGRADINGSYSTEM, [schoolId])
      const requireSplitPercentage = await pool.query(GETSPLITPERCENTAGE, [
        schoolId,
      ])
      if (gradingSystem.rowCount === 0 || requireSplitPercentage.rowCount === 0)
        return res.status(200).json({
          message: "Grading system or split percentage could not be found",
          code: "200",
          data: { ...returnedObj },
        })
      const gradingSystemData = gradingSystem.rows
      const splitPercentage = requireSplitPercentage.rows[0]
      if (resultData.length === 0) {
        let studentListWithBlankRecords = studentsArray.map((student) => {
          return {
            ...student,
            id: "",
            student_id: student.id,
            class_score_num: 0,
            class_score_denom: 0,
            exam_score_num: 0,
            exam_score_denom: 0,
            feedback: "n/a",
            created_at: null,
            updated_at: null,
          }
        })
        studentListWithBlankRecords = ResultsCalculator(
          studentListWithBlankRecords,
          gradingSystemData,
          splitPercentage
        )
        return res.status(200).json({
          message: "",
          code: "200",
          data: {
            results: [...studentListWithBlankRecords],
            page_data: {
              totalCount,
              totalPages,
              currentPage: page,
              pageSize,
            },
          },
        })
      }
      let recordsWithValue = []
      const studentsWithBlankRecords = studentsArray.filter(
        (student) =>
          !resultData.map((record) => record.student_id).includes(student.id)
      )
      const blankRecords = studentsWithBlankRecords.map((student) => {
        return {
          ...student,
          id: "",
          student_id: student.id,
          class_score_num: 0,
          class_score_denom: 0,
          exam_score_num: 0,
          exam_score_denom: 0,
          feedback: "n/a",
          created_at: null,
          updated_at: null,
        }
      })
      studentsArray.map((student) => {
        resultData.map((record) => {
          if (student.id === record.student_id) {
            recordsWithValue = [
              ...recordsWithValue,
              {
                ...student,
                id: record.id,
                student_id: record.student_id,
                class_score_num: record.class_score_num,
                class_score_denom: record.class_score_denom,
                exam_score_num: record.exam_score_num,
                exam_score_denom: record.exam_score_denom,
                feedback: record.feedback,
                created_at: record.created_at,
                updated_at: record.updated_at,
              },
            ]
          }
        })
      })
      const returnableRecords = ResultsCalculator(
        [...recordsWithValue, ...blankRecords],
        gradingSystemData,
        splitPercentage
      )
      return res.status(200).json({
        message: "",
        code: "200",
        data: {
          results: [...returnableRecords],
          page_data: {
            totalCount,
            totalPages,
            currentPage: page,
            pageSize,
          },
        },
      })
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }

  const VerifyTermStudentAndSubject = async (term, student, subject) => {
    try {
      const check = await pool.query(GETSCHFORVERIFICATION, [
        term,
        student,
        subject,
      ])
      return check
    } finally {
      console.log(true)
    }
  }
  const CheckClassSubjectCorrelationAndActiveTerm = async (
    subject_id,
    student_id,
    term_id
  ) => {
    try {
      const checkStudentSubjectCorrelation = await pool.query(
        GETSTUDENTANDSUBJECTCORRELATION,
        [subject_id, student_id]
      )
      const checkForActiveTerm = await pool.query(GETACTIVETERM, [term_id])
      const studentOffersSubject =
        parseInt(checkStudentSubjectCorrelation.rows[0].class_has_subj) === 1
      return {
        studentOffersSubject,
        termIsActive: checkForActiveTerm.rows[0].status,
      }
    } finally {
      console.log(true)
    }
  }
  const CheckResultAccessibility = async (subjectId, user_id, usertype) => {
    try {
      if (
        usertype === Number(process.env.SMS_ADMIN) ||
        usertype === Number(process.env.SMS_SUPER_ADMIN)
      )
        return true
      const subjectsAccessible =
        usertype === 5 ? await RequireStaffInfo(user_id) : null
      if (!subjectsAccessible) return false
      const staff = subjectsAccessible.info
      if (staff.staff_type.toLowerCase() === "non-academic") return false
      const subject_list = info.accessible_subjects
      if (!subject_list.includes(subjectId)) return false
      return true
    } finally {
      console.log(true)
    }
  }
  const resultUpdate = async (
    res,
    result_id,
    dbStudentId,
    student_id,
    term_id,
    subject_id,
    class_score_num,
    class_score_denom,
    exam_score_num,
    exam_score_denom,
    feedback
  ) => {
    try {
      if (!result_id.match(MONGOOBJECT))
        return res
          .status(400)
          .json({ message: "Bad request", code: "400", data: {} })
      if (dbStudentId !== student_id)
        return res.status(412).json({
          message: "Current action is impracticable",
          code: "412",
          data: {},
        })
      const { studentOffersSubject, termIsActive } =
        await CheckClassSubjectCorrelationAndActiveTerm(
          subject_id,
          student_id,
          term_id
        )
      if (!studentOffersSubject)
        return res.status(412).json({
          message: "Student does not currently offer the selected subject",
          code: "412",
          data: {},
        })
      if (!termIsActive)
        return res.status(412).json({
          message: "Selected term is currently inactive",
          code: "412",
          data: {},
        })
      const classScore_num = parseFloat(class_score_num).toFixed(2)
      const classScore_denom = parseFloat(class_score_denom).toFixed(2)
      const examScore_num = parseFloat(exam_score_num).toFixed(2)
      const examScore_denom = parseFloat(exam_score_denom).toFixed(2)
      const timestamp = new Date().toISOString()
      const update = await pool.query(UPDATERECORD, [
        term_id,
        subject_id,
        Number(classScore_num),
        Number(classScore_denom),
        Number(examScore_num),
        Number(examScore_denom),
        feedback.toLowerCase(),
        timestamp,
        result_id,
      ])
      if (update.rowCount === 0)
        return res.status(412).json({
          message: "No changes made to the existing record",
          code: "412",
          data: {},
        })
      const returnedData = await pool.query(GETRESULT, [result_id])
      return res.status(200).json({
        message: "Result successfully updated",
        code: "200",
        data: {
          ...returnedData.rows[0],
        },
      })
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }
  const resultEntry = (req, res) => {
    let {
      id,
      student_id,
      term_id,
      subject_id,
      class_score_num,
      class_score_denom,
      exam_score_num,
      exam_score_denom,
      feedback,
    } = req.body
    const expected_payload = [
      "student_id",
      "term_id",
      "subject_id",
      "class_score_num",
      "class_score_denom",
      "exam_score_num",
      "exam_score_denom",
      "feedback",
      "id",
    ]
    const checkPayload = isTrueBodyStructure(req.body, expected_payload)
    if (!checkPayload)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const validate = resultEntryValidator(req.body, async () => {
      // check if the student, term and subjects are on the same school
      try {
        const verifyIds = await VerifyTermStudentAndSubject(
          term_id,
          student_id,
          subject_id
        )
        const idDataToArray = [...new Set(Object.values(verifyIds.rows[0]))]
        if (idDataToArray.length !== 1)
          return res
            .status(412)
            .json({ message: "Data mismatch detected", code: "412", data: {} })
        const school_id = idDataToArray[0]
        return extract(school_id, req, res, async () => {
          try {
            class_score_num = class_score_num.toString()
            class_score_denom = class_score_denom.toString()
            exam_score_num = exam_score_num.toString()
            exam_score_denom = exam_score_denom.toString()
            // Check if user has access to the selected subject
            const { user_id, usertype } = req.authed_user_data
            const canWriteAndRewriteOnSubject = await CheckResultAccessibility(
              subject_id,
              user_id,
              usertype
            )
            if (!canWriteAndRewriteOnSubject)
              return res.status(412).json({
                message: "Cannot access this resource",
                code: "412",
                data: {},
              })
            // Check if record exists for the student
            const idIsBlank = cleanExcessWhiteSpaces(id).length === 0
            if (!idIsBlank) {
              if (!id.match(MONGOOBJECT))
                return res
                  .status(400)
                  .json({ message: "Bad request", code: "400", data: {} })
              const checkExistence = await pool.query(GETEXISTINGRECORD, [id])
              if (checkExistence.rowCount === 1)
                return resultUpdate(
                  res,
                  id,
                  checkExistence.rows[0].student_id,
                  student_id,
                  term_id,
                  subject_id,
                  class_score_num,
                  class_score_denom,
                  exam_score_num,
                  exam_score_denom,
                  feedback
                )
              return res
                .status(412)
                .json({ message: "No records found", code: "412", data: {} })
            }
            const countResultPrescence = (
              await pool.query(CHECKRESULTEXISTENCE, [
                student_id,
                term_id,
                subject_id,
              ])
            ).rows[0]
            if (parseInt(countResultPrescence.result_exists) === 1)
              return res.status(412).json({
                message: "Result exists already. Run record update",
                code: "412",
                data: {},
              })
            // check if the student's current class is assigned to the subject selected and active term
            const { studentOffersSubject, termIsActive } =
              await CheckClassSubjectCorrelationAndActiveTerm(
                subject_id,
                student_id,
                term_id
              )
            if (!studentOffersSubject)
              return res.status(412).json({
                message:
                  "Student does not currently offer the selected subject",
                code: "412",
                data: {},
              })
            if (!termIsActive)
              return res.status(412).json({
                message: "Selected term is currently inactive",
                code: "412",
                data: {},
              })
            // save the records in DB
            const result_id = new ObjectId().toString()
            const timestamp = new Date().toISOString()
            class_score_num = parseFloat(class_score_num).toFixed(2)
            class_score_denom = parseFloat(class_score_denom).toFixed(2)
            exam_score_num = parseFloat(exam_score_num).toFixed(2)
            exam_score_denom = parseFloat(exam_score_denom).toFixed(2)
            const register = await pool.query(SAVERECORD, [
              result_id,
              student_id,
              term_id,
              subject_id,
              Number(class_score_num),
              Number(class_score_denom),
              Number(exam_score_num),
              Number(exam_score_denom),
              feedback.toLowerCase(),
              timestamp,
            ])
            if (register.rowCount === 0)
              return res.status(412).json({
                message: "Could not save record",
                code: "412",
                data: {},
              })
            const returnedData = await pool.query(GETRESULT, [result_id])
            return res.status(201).json({
              message: "Result successfully entered",
              code: "201",
              data: {
                ...returnedData.rows[0],
              },
            })
          } catch (error) {
            return res
              .status(500)
              .json({ message: WSWW, code: "500", data: {} })
          }
        })
      } catch (error) {
        return res.status(500).json({ message: WSWW, code: "500", data: {} })
      }
    })
    if (validate !== undefined)
      return res
        .status(412)
        .json({ message: validate.error, code: "412", data: {} })
    return validate
  }
  const deleteResult = async (req, res) => {
    try {
      const params = new URLSearchParams(url.parse(req.url, true).query)
      if (!params.get("result_id"))
        return res
          .status(400)
          .json({ message: "Bad request", code: "400", data: {} })
      const result_id = params.get("result_id")
      if (!result_id.match(MONGOOBJECT))
        return res
          .status(400)
          .json({ message: "Bad request", code: "400", data: {} })
      const requireSchoolAndSubject = await pool.query(GETSCHBYRESULTID, [
        result_id,
      ])
      if (requireSchoolAndSubject.rowCount === 0)
        return res
          .status(412)
          .json({ message: "No records found", code: "412", data: {} })
      const { school_id, subject_id } = requireSchoolAndSubject.rows[0]
      return extract(school_id, req, res, async () => {
        try {
          const { user_id, usertype } = req.authed_user_data
          const canRemoveResult = await CheckResultAccessibility(
            subject_id,
            user_id,
            usertype
          )
          if (!canRemoveResult)
            return res.status(412).json({
              message: "Cannot access this resource",
              code: "412",
              data: {},
            })
          await pool.query(REMOVERECORD, [result_id])
          return res.status(200).json({
            message: "Record removed successfully",
            code: "200",
            data: {},
          })
        } catch (error) {
          return res.status(500).json({ message: WSWW, code: "500", data: {} })
        }
      })
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }

  const GetFilteredData = (data_type, sort_by, array) => {
    const representData = () => {
      let data = []
      if (data_type === "all") return (data = array)
      if (data_type === "students_with_records")
        return (data = array.filter((record) => record.total_score > 0))
      if (data_type === "students_without_records")
        return (data = array.filter((record) => record.total_score === 0))
      return data
    }
    const results = representData()
    if (sort_by === "asc")
      return results.sort((a, b) => {
        a.total_score - b.total_score
      })
    if (sort_by === "desc")
      return results.sort((a, b) => {
        b.total_score - a.total_score
      })
  }
  const FilterDataWithNoRecords = (data_type, sort_by, array) => {
    const representData = () => {
      let data = []
      if (data_type === "all") return (data = array)
      if (data_type === "students_with_records") return data
      if (data_type === "students_without_records")
        return (data = array.filter((record) => record.total_score === 0))
      return data
    }
    const results = representData()
    if (results.length === 0) return []
    if (sort_by === "asc")
      return results.sort((a, b) => {
        a.total_score - b.total_score
      })
    if (sort_by === "desc")
      return results.sort((a, b) => {
        b.total_score - a.total_score
      })
  }
  const filterResults = async (req, res) => {
    const params = new URLSearchParams(url.parse(req.url, true).query)
    const returnedObj = { results: [] }
    if (
      !params.get("sort_by") ||
      !params.get("data_type") ||
      !params.get("class_id") ||
      !params.get("subject_id") ||
      !params.get("term_id")
    )
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const sort_by = params.get("sort_by")
    const data_type = params.get("data_type")
    const class_id = params.get("class_id")
    const subject_id = params.get("subject_id")
    const term_id = params.get("term_id")
    if (
      !["all", "students_with_records", "students_without_records"].includes(
        data_type
      ) ||
      !["desc", "asc"].includes(sort_by) ||
      !Regex.MONGOOBJECT.test(class_id) ||
      !Regex.MONGOOBJECT.test(subject_id) ||
      !Regex.MONGOOBJECT.test(term_id)
    )
      return res.status(200).json({
        message: "Incorrect filters",
        code: "200",
        data: { ...returnedObj },
      })
    try {
      const userOnRequest = RetrieveUserOnRequest(req, res)
      if (!userOnRequest)
        return res.status(200).json({
          message: "Authentication required",
          code: "200",
          data: { ...returnedObj },
        })
      const { user_id, usertype } = userOnRequest
      const getSchoolId = await pool.query(GETSCHOOLBYUSER, [user_id])
      if (getSchoolId.rowCount === 0)
        return res.status(200).json({
          message: "No records found",
          code: "200",
          data: { ...returnedObj },
        })
      const schoolId = getSchoolId.rows[0].school_id
      const getSchoolIdFromClass = await pool.query(GETSCHOOLBYCLASS, [
        class_id,
      ])
      if (getSchoolIdFromClass.rowCount === 0)
        return res
          .status(200)
          .json({ message: "No class records found", code: "200", data: {} })
      if (getSchoolIdFromClass.rows[0].school_id !== schoolId)
        return res.status(200).json({
          message: "Cannot access the requested data",
          code: "200",
          data: { ...returnedObj },
        })
      // Check for the existence of the subject on the class
      const checkSubjectClassCorrelation = await pool.query(
        GETCLASSANDSUBJECTCORRELATION,
        [subject_id, class_id]
      )
      if (parseInt(checkSubjectClassCorrelation.rows[0].class_has_subj) === 0)
        return res.status(200).json({
          message: "Selected subject does not belong to the class",
          code: "200",
          data: { ...returnedObj },
        })
      const { pageSize, offset, page } = Pagination().Setter(params, 1, 10)
      const { totalCount, totalPages } = await getPageParams(
        pageSize,
        "students",
        `current_class = '${class_id}'`
      )
      if (totalCount === 0)
        return res.status(200).json({
          message: "No students found in the selected class",
          code: "200",
          data: { ...returnedObj },
        })
      const studentList = await pool.query(GETSTUDENTSINCLASS, [
        class_id,
        pageSize,
        offset,
      ])
      if (studentList.rowCount === 0)
        return res.status(200).json({
          message: "No students found on the requested page",
          code: "200",
          data: { ...returnedObj },
        })
      const studentsArray = studentList.rows
      const studentIds = [
        ...new Set(studentsArray.map((student) => student.id)),
      ]
      const resultData =
        usertype === parseInt(process.env.SMS_ADMIN) ||
        usertype === parseInt(process.env.SMS_SUPER_ADMIN)
          ? await GetResultForAdmin(subject_id, term_id, studentIds)
          : usertype === parseInt(process.env.SMS_TEACHER)
          ? await GetResultForTeacher(user_id, subject_id, term_id, studentIds)
          : null
      if (!resultData)
        return res.status(200).json({
          message: "Access denied",
          code: "200",
          data: { ...returnedObj },
        })
      // Get grading system and split percentage of the school
      const gradingSystem = await pool.query(GETGRADINGSYSTEM, [schoolId])
      const requireSplitPercentage = await pool.query(GETSPLITPERCENTAGE, [
        schoolId,
      ])
      if (gradingSystem.rowCount === 0 || requireSplitPercentage.rowCount === 0)
        return res.status(200).json({
          message: "Grading system or split percentage could not be found",
          code: "200",
          data: { ...returnedObj },
        })
      const gradingSystemData = gradingSystem.rows
      const splitPercentage = requireSplitPercentage.rows[0]
      if (resultData.length === 0) {
        let studentListWithBlankRecords = studentsArray.map((student) => {
          return {
            ...student,
            id: "",
            student_id: student.id,
            class_score_num: 0,
            class_score_denom: 0,
            exam_score_num: 0,
            exam_score_denom: 0,
            feedback: "n/a",
            created_at: null,
            updated_at: null,
          }
        })
        studentListWithBlankRecords = ResultsCalculator(
          studentListWithBlankRecords,
          gradingSystemData,
          splitPercentage
        )
        // if (data_type === "students_with_records")
        const filteredRecords = FilterDataWithNoRecords(
          data_type,
          sort_by,
          studentListWithBlankRecords
        )
        const { search_results, total_items, total_pages } = localPaginator(
          filteredRecords,
          pageSize,
          page
        )
        return res.status(200).json({
          message: "",
          code: "200",
          data: {
            results: [...search_results],
            page_data: {
              totalCount: total_items,
              totalPages: total_pages,
              currentPage: page,
              pageSize,
            },
          },
        })
      }
      let recordsWithValue = []
      const studentsWithBlankRecords = studentsArray.filter(
        (student) =>
          !resultData.map((record) => record.student_id).includes(student.id)
      )
      const blankRecords = studentsWithBlankRecords.map((student) => {
        return {
          ...student,
          id: "",
          student_id: student.id,
          class_score_num: 0,
          class_score_denom: 0,
          exam_score_num: 0,
          exam_score_denom: 0,
          feedback: "n/a",
          created_at: null,
          updated_at: null,
        }
      })
      studentsArray.map((student) => {
        resultData.map((record) => {
          if (student.id === record.student_id) {
            recordsWithValue = [
              ...recordsWithValue,
              {
                ...student,
                id: record.id,
                student_id: record.student_id,
                class_score_num: record.class_score_num,
                class_score_denom: record.class_score_denom,
                exam_score_num: record.exam_score_num,
                exam_score_denom: record.exam_score_denom,
                feedback: record.feedback,
                created_at: record.created_at,
                updated_at: record.updated_at,
              },
            ]
          }
        })
      })
      let returnableRecords = ResultsCalculator(
        [...recordsWithValue, ...blankRecords],
        gradingSystemData,
        splitPercentage
      )
      const filteredRecords = GetFilteredData(
        data_type,
        sort_by,
        returnableRecords
      )
      const { search_results, total_items, total_pages } = localPaginator(
        filteredRecords,
        pageSize,
        page
      )
      return res.status(200).json({
        message: "",
        code: "200",
        data: {
          results: [...search_results],
          page_data: {
            totalCount: total_items,
            totalPages: total_pages,
            currentPage: page,
            pageSize,
          },
        },
      })
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }

  return {
    getClassSubject,
    getRecords,
    resultEntry,
    deleteResult,
    ResultsCalculator,
    filterResults,
  }
}
