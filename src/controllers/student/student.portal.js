import format from "pg-format"
import DatabaseConnection from "../../config/config.db.js"
import RequestInformation from "../../middlewares/middleware.request_info.js"
import StudentPortalQuery from "../../queries/query.student_portal.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import { Regex } from "../../utils/static/index.js"
import { compareSync, genSaltSync, hashSync } from "bcrypt"
import StudentAccessValidations from "../../validators/validator.student_access.js"
import PhotoUploader from "../../helpers/helper.photo_uploader.js"
import url from "url"
import AcademicRecordController from "../academics/academics.records.js"

export default function StudentPortalControllers() {
  const { pool } = DatabaseConnection()
  const WSWW = "Whoops! Something went wrong"
  const portalQueries = StudentPortalQuery()
  const { isTrueBodyStructure } = RequestBodyChecker()
  const regex = Regex
  const SALT = genSaltSync(10)
  const validations = StudentAccessValidations()
  const photo_system = PhotoUploader()
  const { ResultsCalculator } = AcademicRecordController()

  const PrepareTerms = (array) => {
    if (array.length === 0) return []
    let years = array.map(({ name, id, start_date, end_date, ...rest }) => rest)
    years = [...new Map(years.map((yr) => [yr.academic_year_id, yr])).values()]
    const prepared_data = years.map((year) => {
      const terms = array.filter(
        (ar) => ar.academic_year_id === year.academic_year_id
      )
      return {
        academic_year_id: year.academic_year_id,
        academic_year: year.acad_year,
        is_current: year.status,
        terms: [
          ...terms.map(({ academic_year_id, acad_year, ...rest }) => rest),
        ],
      }
    })
    return prepared_data
  }

  const getStudentInformation = async (req, res) => {
    const request_sender = RequestInformation(req, res)
    const objKeysArray = Object.keys(request_sender)
    if (!objKeysArray.includes("id") || !objKeysArray.includes("school_id"))
      return res
        .status(200)
        .json({ message: "Authentication required", code: "200", data: {} })
    const student_id = request_sender.id
    const school_id = request_sender.school_id
    try {
      const student = await pool.query(portalQueries.GETSTUDENT, [student_id])
      const data = student.rowCount > 0 ? student.rows[0] : {}
      if (Object.keys(data).length === 0)
        return res.status(200).json({
          message: "",
          code: "200",
          data: {
            student: { ...data },
            classes: [],
            terms: {},
          },
        })
      const terms = await pool.query(portalQueries.GETTERMS, [school_id])
      const termsData = terms.rows
      const classes = data.classes
      const queryFormat = format("%L", classes)
      const query = `SELECT c.id, c.classname, c.shortname FROM classes c
            WHERE c.id IN (${queryFormat})`
      const classData = await pool.query(query)
      return res.status(200).json({
        message: "",
        code: "200",
        data: {
          student: {
            ...data,
            classes: undefined,
            photo_id: undefined,
            current_class: {
              ...classData.rows.filter(
                (cItem) => cItem.id === data.current_class
              )[0],
            },
            username: data.index_no,
          },
          classes: [...classData.rows],
          terms: PrepareTerms([...termsData]),
        },
      })
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }

  const studentAccountSetting = async (req, res) => {
    let { password, old_password, passport_photo } = req.body
    const expected_payload = ["password", "old_password", "passport_photo"]
    const checkPayload = isTrueBodyStructure(req.body, expected_payload)
    if (!checkPayload)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const validate = validations.validateAccountSetting(req.body, async () => {
      try {
        const request_sender = RequestInformation(req, res)
        const objKeysArray = Object.keys(request_sender)
        if (!objKeysArray.includes("id"))
          return res
            .status(412)
            .json({ message: "Authentication required", code: "412", data: {} })
        const student_id = request_sender.id
        const getStudent = await pool.query(portalQueries.GETSTUDENTFORUPDATE, [
          student_id,
        ])
        if (getStudent.rowCount === 0)
          return res
            .status(412)
            .json({ message: "No records found", code: "412", data: {} })
        const studentData = getStudent.rows[0]
        const truePhoto = passport_photo.split(",", 2).length
        const passportUpload =
          truePhoto !== 2
            ? null
            : await photo_system.ImageStorage(
                studentData.photo_id,
                passport_photo,
                "students"
              )
        const passportId = !passportUpload
          ? studentData.photo_id
          : passportUpload.photo_id
        const passportUrl = !passportUpload
          ? studentData.photo_url
          : passportUpload.secure_url
        password =
          password.match(regex.PASSWORD) && password.length >= 8
            ? hashSync(password, SALT)
            : null
        const timestamp = new Date().toISOString()
        const returnedData = {
          ...studentData,
          photo_url: passportUrl,
          password: undefined,
          photo_id: undefined,
        }
        if (!password) {
          await pool.query(portalQueries.UPDATEPASSPORTPHOTO, [
            passportId,
            passportUrl,
            timestamp,
            student_id,
          ])
          return res.status(200).json({
            message: "Data saved successfully",
            code: "200",
            data: {
              ...returnedData,
            },
          })
        }
        const checkOldPass = compareSync(old_password, studentData.password)
        if (!checkOldPass)
          return res.status(412).json({
            message: "Please enter a correct old password",
            code: "412",
            data: {},
          })
        await pool.query(portalQueries.ACCOUNTSETTINGS, [
          passportId,
          passportUrl,
          password,
          timestamp,
          student_id,
        ])
        return res.status(200).json({
          message: "Data saved successfully",
          code: "200",
          data: {
            ...returnedData,
          },
        })
      } catch (error) {
        return res.status(500).json({ message: WSWW, code: "500", data: {} })
      }
    })
    if (validate !== undefined)
      return res
        .status(412)
        .json({ message: validate.error, code: "412", data: {} })
  }

  const getAverageScore = async (class_id, term_id, splitPercentage) => {
    try {
      let average_score = 0

      const GetStudentQuery = `SELECT id FROM students WHERE current_class = $1`
      const students = await pool.query(GetStudentQuery, [class_id])
      const fromattedStudent_ids = format(
        "%L",
        students.rows.map((student) => student.id)
      )
      const GetStudentResultQuery = `SELECT student_id, class_score_num, class_score_denom, exam_score_num, exam_score_denom FROM academic_records WHERE term_id = $1 AND student_id IN (${fromattedStudent_ids})`
      const getResults = await pool.query(GetStudentResultQuery, [term_id])
      if (getResults.rowCount === 0) return average_score
      let classScoreSum = 0
      let examScoreSum = 0
      for (let i = 0; i < getResults.rows.length; i++) {
        const record = getResults.rows[i]
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
        classScoreSum +=
          (class_score_num / class_score_denom) *
          splitPercentage.total_class_score
        examScoreSum +=
          (exam_score_num / exam_score_denom) * splitPercentage.total_exam_score
      }
      const totalScore = classScoreSum + examScoreSum
      average_score = totalScore / students.rows.length
      return average_score
    } finally {
      console.log(true)
    }
  }

  const getClassPosition = async (term_id, class_id, student_id) => {
    try {
      const query = `SELECT 
                    ar.id, 
                    ar.student_id, 
                    (CAST(ar.class_score_num AS INT) + CAST(ar.exam_score_num AS INT)) AS total_score
                FROM 
                    academic_records ar
                INNER JOIN 
                    students s ON ar.student_id = s.id
                WHERE 
                    s.current_class = $1 
                    AND ar.term_id = $2
            `
      const getTotals = await pool.query(query, [class_id, term_id])
      if (getTotals.rowCount === 0) return null
      const totalScores = getTotals.rows

      const totalScoresByStudentId = totalScores.reduce(
        (data, { id, student_id, total_score }) => {
          if (!data[student_id]) {
            data[student_id] = { id, student_id, total_score }
          } else {
            data[student_id].total_score += total_score
          }
          return data
        },
        {}
      )
      const scoresArray = Object.values(totalScoresByStudentId)
        .map(({ id, student_id, total_score }) => ({
          id,
          student_id,
          total_score,
        }))
        .sort((a, b) => {
          return b.total_score - a.total_score
        })

      const studentTotalScore = scoresArray.filter(
        (score) => score.student_id === student_id
      )
      if (studentTotalScore.length !== 1) return null
      const studentTotalScoreObj = studentTotalScore[0]
      const studentPositionIndex = scoresArray.indexOf(studentTotalScoreObj)
      if (studentPositionIndex === -1) return null
      return studentPositionIndex + 1
    } catch (error) {
      return null
    }
  }

  const fetchResult = async (req, res) => {
    const params = new URLSearchParams(url.parse(req.url, true).query)
    if (!params.get("class_id") || !params.get("term_id"))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const class_id = params.get("class_id")
    const term_id = params.get("term_id")
    if (!class_id.match(regex.MONGOOBJECT) || !term_id.match(regex.MONGOOBJECT))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    try {
      const request_sender = RequestInformation(req, res)
      const objKeysArray = Object.keys(request_sender)
      if (!objKeysArray.includes("id"))
        return res
          .status(200)
          .json({ message: "Authentication required", code: "200", data: {} })
      const student_id = request_sender.id
      const school_id = request_sender.school_id
      const returnedData = {
        result: [],
      }
      const getStudentClasses = await pool.query(
        portalQueries.GETSTUDENTCLASSES,
        [student_id]
      )
      if (getStudentClasses.rowCount === 0)
        return res.status(200).json({
          message:
            "Selected class does not belong to your current and previous classes",
          code: "200",
          data: { ...returnedData },
        })
      const classes = getStudentClasses.rows[0].classes
      if (classes.length === 0)
        return res.status(200).json({
          message:
            "Selected class does not belong to your current and previous classes",
          code: "200",
          data: { ...returnedData },
        })
      if (!classes.includes(class_id))
        return res.status(200).json({
          message:
            "Selected class does not belong to your current and previous classes",
          code: "200",
          data: { ...returnedData },
        })
      const getTerm = await pool.query(portalQueries.VERIFYTERM, [
        term_id,
        school_id,
      ])
      if (parseInt(getTerm.rows[0].term_presence) === 0)
        return res.status(200).json({
          message: "Selected term does not exists",
          code: "200",
          data: { ...returnedData },
        })
      const getGradingSystem = await pool.query(
        portalQueries.GETGRADINGSYSTEM,
        [school_id]
      )
      const getSplitPercentage = await pool.query(
        portalQueries.GETSPLITPERCENTAGE,
        [school_id]
      )
      if (getGradingSystem.rowCount === 0 || getSplitPercentage.rowCount === 0)
        return res.status(200).json({
          message: "Data is currently not available",
          code: "200",
          data: { ...returnedData },
        })
      const gradingSystemData = getGradingSystem.rows
      const splitPercentage = getSplitPercentage.rows[0]
      const getClassSubject = await pool.query(
        portalQueries.GETSUBJECTSINCLASS,
        [class_id]
      )
      if (getClassSubject.rowCount === 0)
        return res.status(200).json({
          message: "No subjects found in the selected class",
          code: "200",
          data: { ...returnedData },
        })
      const subjects = getClassSubject.rows
      const queryFormat = format(
        "%L",
        subjects.map((subj) => subj.id)
      )
      const query = `SELECT id, subject_id, class_score_num, class_score_denom, exam_score_num, exam_score_denom, feedback FROM academic_records WHERE student_id = '${student_id}' AND term_id = '${term_id}' AND subject_id IN (${queryFormat})`
      const getResultList = await pool.query(query)
      const resultList = ResultsCalculator(
        getResultList.rows,
        gradingSystemData,
        splitPercentage
      )
      const finalRecords = resultList.map((list) => {
        let newlist = {}
        subjects.map((subj) => {
          if (subj.id === list.subject_id) {
            newlist = {
              ...list,
              subject_name: subj.subject_name,
              subject_code: subj.subject_code,
            }
            return {
              ...newlist,
            }
          }
        })
        return newlist
      })
      const studentsCount = await pool.query(
        `SELECT COUNT(id) AS students_count FROM students WHERE current_class = $1`,
        [class_id]
      )
      const average_score = await getAverageScore(
        class_id,
        term_id,
        splitPercentage
      )
      const classPosition = await getClassPosition(
        term_id,
        class_id,
        student_id
      )
      return res.status(200).json({
        message: "",
        code: "200",
        data: {
          total_students_in_class: parseInt(
            studentsCount.rows[0].students_count
          ),
          result: [...finalRecords],
          average_score,
          class_position: classPosition,
        },
      })
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }

  return {
    getStudentInformation,
    studentAccountSetting,
    fetchResult,
  }
}
