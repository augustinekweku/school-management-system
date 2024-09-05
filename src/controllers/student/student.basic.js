import StudentValidator from "../../validators/validator.student.js"
import DatabaseConnection from "../../config/config.db.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import StringManipulators from "../../utils/algos/StringManipulators.js"
import StudentsQuery from "../../queries/query.students.js"
import IndexNumberGenerator from "../../helpers/helper.generate_index_no.js"
import { ObjectId } from "bson"
import url from "url"
import { Regex } from "../../utils/static/index.js"
import Pagination from "../../helpers/helper.pagination_setter.js"
import PaginationParams from "../../helpers/helper.paginator.js"
import SchoolQueries from "../../queries/query.school.js"
import format from "pg-format"
import PhotoUploader from "../../helpers/helper.photo_uploader.js"
import ConfigureParents from "./student.parent.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import { genSaltSync, hashSync } from "bcrypt"

export default function StudentsBasicInformation() {
  const { createStudentValidator, studentUpdateValidator } = StudentValidator()
  const { extract } = Eligibility_Extractor()
  const { GetParentRelationsOnStudent } = ConfigureParents()
  const { ImageStorage, ImageDestroy } = PhotoUploader()
  const { capitalize, cleanSCW, cleanExcessWhiteSpaces, polishLongTexts } =
    StringManipulators()
  const { generate } = IndexNumberGenerator()
  const { getPageParams, localPaginator } = PaginationParams()
  const { isTrueBodyStructure } = RequestBodyChecker()
  const { pool } = DatabaseConnection()
  const {
    GETSTUDENTS,
    SAVESTUDENT,
    PAGINATED_STUDENTS,
    GETSTUDENT,
    PUTSTUDENT_IN_CLASS,
    COUNT_STUDENTS,
    UPDATE_STUDENT,
    UPDATE_PIVOT_TB,
    REMOVE_STUDENT,
  } = StudentsQuery()
  const { CHECK_CLASS, GETCLASSESBYSCHOOL } = SchoolQueries()
  const WSWW = "Whoops! Something went wrong!"
  const { MONGOOBJECT } = Regex
  const SALT = genSaltSync(10)

  const putStudentInClass = async (res, class_id, student_id) => {
    try {
      const classes = [class_id]
      await pool.query(PUTSTUDENT_IN_CLASS, [student_id, classes])
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }
  const createStudent = (req, res) => {
    let {
      firstname,
      othername,
      lastname,
      gender,
      nationality,
      dob,
      language,
      telephone,
      address,
      school_id,
      last_school_attended,
      is_new_student,
      class_id,
      passport_photo,
    } = req.body
    const expected_payload = [
      "firstname",
      "othername",
      "lastname",
      "gender",
      "nationality",
      "dob",
      "language",
      "telephone",
      "address",
      "school_id",
      "last_school_attended",
      "is_new_student",
      "class_id",
      "passport_photo",
    ]
    const checkPayload = isTrueBodyStructure(req.body, expected_payload)
    if (!checkPayload)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const validate = createStudentValidator(req.body, async () => {
      // firstname = cleanSCW(firstname)
      othername = othername.trim().length === 0 ? "" : othername
      // lastname = cleanSCW(lastname)
      nationality = cleanSCW(nationality)
      gender = gender.toLowerCase()
      language =
        language.length === 0 ? [] : language.map((item) => cleanSCW(item))
      address = address.trim().length === 0 ? "" : address
      last_school_attended =
        last_school_attended.trim().length === 0 ? "" : last_school_attended
      is_new_student =
        typeof is_new_student !== "boolean" ? true : !!is_new_student
      telephone = polishLongTexts(telephone)
      return extract(school_id, req, res, async () => {
        try {
          const result = await pool.query(CHECK_CLASS, [class_id])
          if (result.rowCount === 0)
            return res.status(412).json({
              message: "Class does not exists in this school",
              code: "200",
              data: {},
            })
          const classData = result.rows[0]
          if (classData.school_id !== school_id)
            return res.status(412).json({
              message: "Class does not exists in this school",
              code: "200",
              data: {},
            })
          const timestamp = new Date().toISOString()
          const students = await pool.query(GETSTUDENTS, [school_id])
          const data = students.rows
          const index_no = generate(data, req.school_data.row_id)
          const studentId = new ObjectId().toString()
          const truePhoto = passport_photo.split(",", 2).length
          const passportUpload =
            truePhoto !== 2
              ? null
              : await ImageStorage(null, passport_photo, "students")
          const passportId = !passportUpload ? null : passportUpload.photo_id
          const passportUrl = !passportUpload ? null : passportUpload.secure_url
          const password = "newSecret_204"
          const passwordHashed = hashSync(password, SALT)
          await pool.query(SAVESTUDENT, [
            studentId,
            school_id,
            firstname,
            lastname,
            othername,
            gender,
            dob,
            language,
            telephone,
            nationality,
            address,
            index_no,
            last_school_attended,
            timestamp,
            is_new_student,
            passportId,
            passportUrl,
            class_id,
            passwordHashed,
          ])
          await putStudentInClass(res, class_id, studentId)
          return res.status(201).json({
            message: "Student data created successfully",
            code: "201",
            data: {
              id: studentId,
              school_id,
              firstname,
              othername,
              lastname,
              gender,
              dob: dob.substring(0, 10),
              spoken_languages: [...language],
              telephone,
              nationality,
              address,
              index_no,
              last_school_attended,
              created_at: timestamp,
              updated_at: timestamp,
              is_new: is_new_student,
              photo_url: passportUrl,
              current_class: {
                id: classData.id,
                classname: classData.classname,
                shortname: classData.shortname,
              },
            },
          })
        } catch (error) {
          console.log(error)
          return res.status(500).json({ message: WSWW, code: "500", data: {} })
        }
      })
    })
    if (validate !== undefined)
      return res
        .status(412)
        .json({ message: validate.error, code: "412", data: {} })
    return validate
  }
  const getStudents = async (req, res) => {
    const params = new URLSearchParams(url.parse(req.url, true).query)
    if (!params.get("school_id"))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const school_id = params.get("school_id")
    if (!school_id.toString().match(MONGOOBJECT))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    try {
      const { pageSize, offset, page } = Pagination().Setter(params, 1, 10)
      const pageParams = await getPageParams(
        pageSize,
        "students",
        `school_id = '${school_id}'`
      )
      const students = await pool.query(PAGINATED_STUDENTS, [
        school_id,
        pageSize,
        offset,
      ])
      return res.status(200).json({
        message: "",
        code: "200",
        data: {
          students: students.rows,
          page_data: {
            ...pageParams,
            currentPage: page,
            pageSize,
          },
        },
      })
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }
  const getStudent = async (req, res) => {
    const params = new URLSearchParams(url.parse(req.url, true).query)
    if (!params.get("student_id"))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const student_id = params.get("student_id")
    if (!student_id.toString().match(MONGOOBJECT))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    try {
      const result = await pool.query(GETSTUDENT, [student_id])
      const data = result.rowCount > 0 ? result.rows[0] : {}
      if (Object.keys(data).length === 0)
        return res.status(200).json({
          message: "",
          code: "200",
          data: {
            student: { ...data },
            classes: [],
          },
        })
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
            current_class: {
              ...classData.rows.filter(
                (cItem) => cItem.id === data.current_class
              )[0],
            },
            username: data.index_no,
          },
          classes: [...classData.rows],
        },
      })
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }
  const updateStudent = (req, res) => {
    let {
      student_id,
      classes,
      firstname,
      othername,
      lastname,
      gender,
      nationality,
      dob,
      language,
      telephone,
      address,
      last_school_attended,
      is_new_student,
      passport_photo,
      current_class,
    } = req.body
    const expected_payload = [
      "student_id",
      "classes",
      "firstname",
      "othername",
      "lastname",
      "gender",
      "nationality",
      "dob",
      "language",
      "telephone",
      "address",
      "last_school_attended",
      "is_new_student",
      "passport_photo",
      "current_class",
    ]
    const checkPayload = isTrueBodyStructure(req.body, expected_payload)
    if (!checkPayload)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const validate = studentUpdateValidator(req.body, () => {
      // firstname = cleanSCW(firstname)
      othername = othername.trim().length === 0 ? "" : othername
      // lastname = cleanSCW(lastname)
      nationality = cleanSCW(nationality)
      gender = gender.toLowerCase()
      language = language.length === 0 ? [] : language
      address = address.trim().length === 0 ? "" : address
      last_school_attended =
        last_school_attended.trim().length === 0 ? "" : last_school_attended
      is_new_student =
        typeof is_new_student !== "boolean" ? true : !!is_new_student
      telephone = polishLongTexts(telephone)
      pool
        .query(GETSTUDENT, [student_id])
        .then(async (student) => {
          if (student.rowCount === 0)
            return res.status(412).json({
              message: "No student records found",
              code: "412",
              data: {},
            })
          const studentData = student.rows[0]
          const truePhoto = passport_photo.split(",", 2).length
          const passportUpload =
            truePhoto !== 2
              ? null
              : await ImageStorage(
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
          const timestamp = new Date().toISOString()
          return extract(studentData.school_id, req, res, () => {
            pool
              .query(GETCLASSESBYSCHOOL, [studentData.school_id])
              .then((classArray) => {
                const dbClasses = classArray.rows
                let studentClasses = [],
                  classesWithDesc = []
                for (let i = 0; i < dbClasses.length; i++) {
                  const dbClassItem = dbClasses[i].id
                  for (let j = 0; j < classes.length; j++) {
                    const selectedClassItem = classes[j]
                    if (dbClassItem === selectedClassItem) {
                      studentClasses = [...studentClasses, selectedClassItem]
                      classesWithDesc = [...classesWithDesc, dbClasses[i]]
                    }
                  }
                }
                if (
                  studentClasses.length !== classes.length ||
                  !dbClasses.some((cItem) => cItem.id === current_class)
                )
                  return res.status(412).json({
                    message: "Select only valid classes",
                    code: "412",
                    data: {},
                  })
                pool
                  .query(UPDATE_STUDENT, [
                    firstname,
                    othername,
                    lastname,
                    nationality,
                    gender,
                    language,
                    address,
                    last_school_attended,
                    is_new_student,
                    telephone,
                    dob,
                    timestamp,
                    passportId,
                    passportUrl,
                    current_class,
                    student_id,
                  ])
                  .then(() => {
                    pool
                      .query(UPDATE_PIVOT_TB, [studentClasses, student_id])
                      .then(() => {
                        const returnableClasses = classesWithDesc.map(
                          ({
                            row_id,
                            school_id,
                            created_at,
                            updated_at,
                            ...others
                          }) => others
                        )
                        return res.status(200).json({
                          message: "Student record was successfully updated",
                          code: "200",
                          data: {
                            ...student.rows[0],
                            firstname,
                            lastname,
                            othername,
                            gender,
                            nationality,
                            spoken_languages: language,
                            address,
                            is_new_student,
                            telephone,
                            updated_at: timestamp,
                            dob,
                            classes: [...returnableClasses],
                            photo_url: passportUrl,
                            id: student_id,
                            current_class: returnableClasses.filter(
                              (cItem) => cItem.id === current_class
                            )[0],
                          },
                        })
                      })
                      .catch((err) => {
                        return res
                          .status(500)
                          .json({ message: WSWW, code: "500", data: {} })
                      })
                  })
                  .catch((err) => {
                    return res
                      .status(500)
                      .json({ message: WSWW, code: "500", data: {} })
                  })
              })
              .catch((err) => {
                return res
                  .status(500)
                  .json({ message: WSWW, code: "500", data: {} })
              })
          })
        })
        .catch((err) => {
          return res.status(500).json({ message: WSWW, code: "500", data: {} })
        })
    })
    if (validate !== undefined)
      return res
        .status(412)
        .json({ message: validate.error, code: "412", data: {} })
    return validate
  }
  const getTotalStudentsPerSchool = (req, res) => {
    let countObject = {
      total_male_students: 0,
      total_female_students: 0,
      student_count: 0,
    }
    const params = new URLSearchParams(url.parse(req.url, true).query)
    if (!params.get("school_id"))
      return res
        .status(200)
        .json({ message: "", code: "200", data: { ...countObject } })
    const school_id = params.get("school_id")
    if (!school_id.match(MONGOOBJECT))
      return res
        .status(200)
        .json({ message: "", code: "200", data: { ...countObject } })
    pool
      .query(COUNT_STUDENTS, ["male", "female", school_id])
      .then((count) => {
        const data = count.rows[0]
        return res.status(200).json({
          message: "",
          code: "200",
          data: {
            ...countObject,
            student_count: data.student_count,
            total_male_students:
              data.total_male_students === null ? 0 : data.total_male_students,
            total_female_students:
              data.total_female_students === null
                ? 0
                : data.total_female_students,
          },
        })
      })
      .catch((err) => {
        return res.status(500).json({ message: WSWW, code: "500", data: {} })
      })
  }
  const deleteStudent = (req, res) => {
    const params = new URLSearchParams(url.parse(req.url, true).query)
    if (!params.get("student_id"))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const student_id = params.get("student_id")
    if (!student_id.match(MONGOOBJECT))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    pool
      .query(GETSTUDENT, [student_id])
      .then((student) => {
        if (student.rowCount === 0)
          return res.status(412).json({
            message: "No student records found",
            code: "412",
            data: {},
          })
        const studentData = student.rows[0]
        const trashStudent = async () => {
          try {
            await pool.query(REMOVE_STUDENT, [student_id])
            await ImageDestroy(studentData.photo_id)
            return res.status(200).json({
              message: "Student data deleted successfully",
              code: "200",
              data: {},
            })
          } catch (error) {
            return res
              .status(500)
              .json({ message: WSWW, code: "500", data: {} })
          }
        }
        return extract(studentData.school_id, req, res, async () => {
          try {
            const parent_list = await GetParentRelationsOnStudent(student_id)
            if (parent_list.rowCount === 0) return trashStudent()
            const parentIdList = [
              ...new Set(parent_list.rows.map((item) => item.parent_id)),
            ]
            const formatQuery = format("%L", parentIdList)
            const Query = `SELECT * FROM parent_student_tb WHERE parent_id IN (${formatQuery})`
            const studentSiblingList = await pool.query(Query)
            const siblingsData = studentSiblingList.rows.filter(
              (item) => item.student_id !== student_id
            )
            if (siblingsData.length > 0) return trashStudent()
            const DeleteParentsQuery = `DELETE FROM parents WHERE id IN (${formatQuery})`
            await pool.query(DeleteParentsQuery)
            return trashStudent()
          } catch (error) {
            return res
              .status(500)
              .json({ message: WSWW, code: "500", data: {} })
          }
        })
      })
      .catch((err) => {
        return res.status(500).json({ message: WSWW, code: "500", data: {} })
      })
  }
  const searchStudents = (req, res) => {
    const params = new URLSearchParams(url.parse(req.url, true).query)
    if (!params.get("school_id") || !params.get("q"))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const school_id = params.get("school_id")
    const q = cleanSCW(params.get("q")).toLowerCase()
    if (!school_id.match(MONGOOBJECT))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    pool
      .query(GETSTUDENTS, [school_id])
      .then((students) => {
        const data = students.rows.filter(
          (item) =>
            JSON.stringify(item).toLowerCase().includes(q) ||
            item.spoken_languages.includes(q)
        )
        const { pageSize, page } = Pagination().Setter(params, 1, 10)
        const { total_pages, search_results, total_items } = localPaginator(
          data,
          pageSize,
          page
        )
        return res.status(200).json({
          message: "",
          code: "200",
          data: {
            students: [...search_results.map(({ row_id, ...rest }) => rest)],
            page_data: {
              totalCount: total_items,
              totalPages: total_pages,
              currentPage: page,
              pageSize: pageSize,
            },
          },
        })
      })
      .catch((err) => {
        return res.status(500).json({ message: WSWW, code: "500", data: {} })
      })
  }
  return {
    createStudent,
    getStudents,
    getStudent,
    updateStudent,
    getTotalStudentsPerSchool,
    deleteStudent,
    searchStudents,
  }
}
