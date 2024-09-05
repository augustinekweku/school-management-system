import DatabaseConnection from "../../config/config.db.js"
import StringManipulators from "../../utils/algos/StringManipulators.js"
import StaffValidations from "../../validators/validator.staff.js"
import Eligibility_Extractor from "../../helpers/helper.account_sch_relation.js"
import { genSaltSync, hashSync } from "bcrypt"
import format from "pg-format"
import { ObjectId } from "bson"
import StaffQuery from "../../queries/query.staff.js"
import StaffNoGenerator from "../../helpers/helper.generate_staff_no.js"
import PhotoUploader from "../../helpers/helper.photo_uploader.js"
import url from "url"
import Pagination from "../../helpers/helper.pagination_setter.js"
import PaginationParams from "../../helpers/helper.paginator.js"
import { Regex } from "../../utils/static/index.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"

export default function StaffConfigurations() {
  const { staffValidator } = StaffValidations()
  const { cleanExcessWhiteSpaces, cleanSCW } = StringManipulators()
  const { extract } = Eligibility_Extractor()
  const { generate } = StaffNoGenerator()
  const { pool } = DatabaseConnection()
  const { isTrueBodyStructure } = RequestBodyChecker()
  const {
    CREATE_STAFF_ACCOUNT,
    SAVE_STAFF,
    GETSTAFF,
    UPDATE_STAFF,
    STAFFCOUNTER,
    UPDATE_ACCOUNT,
    DELETESTAFF,
    CHECKSTAFF,
    PAGINATED_STAFF,
    STAFFBYSCHOOL_ID,
  } = StaffQuery()
  const WSWW = "Whoops! Something went wrong"
  const SALT = genSaltSync(10)
  const { MONGOOBJECT } = Regex
  const { ImageStorage, ImageDestroy } = PhotoUploader()
  const { getPageParams, localPaginator } = PaginationParams()

  const CheckStaffPresence = async (email, phone) => {
    try {
      const check = await pool.query(CHECKSTAFF, [email, phone])
      return check
    } finally {
      console.log(true)
    }
  }
  const CheckSubjects = async (subjects) => {
    const formatQuery = format("%L", subjects)
    const Query = `SELECT school_id FROM subjects WHERE id IN (${formatQuery})`
    try {
      const check = await pool.query(Query)
      return check
    } finally {
      console.log(true)
    }
  }
  const FetchSubjects = async (subjects) => {
    const formatQuery = format("%L", subjects)
    const Query = `SELECT s.id, s.school_id, s.class_id, c.classname, c.shortname, s.subject_code, s.subject_name FROM subjects s INNER JOIN classes c ON s.class_id = c.id WHERE s.id IN (${formatQuery})`
    try {
      const data = await pool.query(Query)
      return data
    } finally {
      console.log(true)
    }
  }
  const CreateStaffAccount = async (
    firstname,
    lastname,
    email,
    phone,
    password,
    gender,
    accountUsertype
  ) => {
    const id = new ObjectId().toString()
    const timestamp = new Date().toISOString()
    const usertype = accountUsertype
    const verified = true
    try {
      const create = await pool.query(CREATE_STAFF_ACCOUNT, [
        id,
        firstname,
        lastname,
        email,
        phone,
        password,
        gender,
        usertype,
        verified,
        timestamp,
      ])
      return { ...create, timestamp }
    } finally {
      console.log(true)
    }
  }

  const saveStaff = async (
    res,
    school_id,
    staff_type,
    net_salary,
    position,
    accessible_subjects,
    date_joined,
    firstname,
    lastname,
    email,
    phone,
    password,
    gender,
    passport_photo
  ) => {
    let staff_no = await generate(school_id)
    let trueSNO = parseInt(staff_no).toString().length === 8
    while (!trueSNO) {
      staff_no = await generate(school_id)
      if (parseInt(staff_no).toString().length === 8) trueSNO = true
    }
    if (!staff_no)
      return res.status(500).json({ message: WSWW, code: "500", data: {} })

    // account's usertype

    const accountUsertype = position === "teacher" ? 5 : 6

    CreateStaffAccount(
      firstname,
      lastname,
      email,
      phone,
      password,
      gender,
      accountUsertype
    )
      .then(async (staff) => {
        const user_id = staff.rows[0].id
        const timestamp = staff.timestamp
        const truePhoto = passport_photo.split(",", 2).length
        const passportUpload =
          truePhoto !== 2
            ? null
            : await ImageStorage(null, passport_photo, "staff")
        const passportId = !passportUpload ? null : passportUpload.photo_id
        const passportUrl = !passportUpload ? null : passportUpload.secure_url
        pool
          .query(SAVE_STAFF, [
            user_id,
            school_id,
            staff_no,
            staff_type,
            net_salary,
            position,
            accessible_subjects,
            date_joined,
            timestamp,
            passportId,
            passportUrl,
          ])
          .then(async () => {
            const dataObj = {
              id: user_id,
              firstname,
              lastname,
              email,
              phone,
              gender,
              staff_detail: {
                staff_no,
                staff_type,
                position,
                date_joined,
                net_salary,
                accessible_subjects:
                  accessible_subjects.length === 0 ? [] : accessible_subjects,
              },
              created_at: timestamp,
              updated_at: timestamp,
              passport_photo: passportUrl,
            }
            try {
              const scData =
                accessible_subjects.length > 0
                  ? await FetchSubjects(accessible_subjects)
                  : null
              dataObj.staff_detail.accessible_subjects = !scData
                ? []
                : [...scData.rows]
              return res.status(201).json({
                message: "Staff member created successfully",
                code: "201",
                data: { ...dataObj },
              })
            } catch (error) {
              return res.status(201).json({
                message: "Staff member created successfully",
                code: "201",
                data: { ...dataObj },
              })
            }
          })
          .catch((err) => {
            return res
              .status(500)
              .json({ message: WSWW, code: "500", data: {} })
          })
        return
      })
      .catch((err) => {
        return res.status(500).json({ message: WSWW, code: "500", data: {} })
      })
  }

  const createStaff = (req, res) => {
    let {
      school_id,
      staff_type,
      net_salary,
      position,
      accessible_subjects,
      date_joined,
      firstname,
      lastname,
      email,
      phone,
      password,
      gender,
      passport_photo,
    } = req.body
    const expected_payload = [
      "school_id",
      "staff_type",
      "net_salary",
      "position",
      "accessible_subjects",
      "date_joined",
      "firstname",
      "lastname",
      "email",
      "phone",
      "password",
      "password_confirmation",
      "gender",
      "passport_photo",
    ]
    const checkPayload = isTrueBodyStructure(req.body, expected_payload)
    if (!checkPayload)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    req.body = { ...req.body, staff_id: new ObjectId().toString() }
    const validate = staffValidator(req.body, async () => {
      try {
        phone = cleanExcessWhiteSpaces(phone)
        // firstname = cleanSCW(firstname)
        // lastname = cleanSCW(lastname)
        staff_type = position === "teacher" ? "academic" : "non-academic"
        // position = cleanSCW(position)
        gender = cleanExcessWhiteSpaces(gender).toLowerCase()
        password = hashSync(password, SALT)
        const result = await CheckStaffPresence(email, phone)
        if (result.rowCount > 0)
          return res.status(412).json({
            message: "Email or phone has been taken",
            code: "412",
            data: {},
          })
        return extract(school_id, req, res, async () => {
          try {
            const checkSubjects =
              accessible_subjects.length > 0
                ? await CheckSubjects(accessible_subjects)
                : null
            if (!checkSubjects)
              return saveStaff(
                res,
                school_id,
                staff_type,
                net_salary,
                position,
                accessible_subjects,
                date_joined,
                firstname,
                lastname,
                email,
                phone,
                password,
                gender,
                passport_photo
              )
            const isNotAValidSubject = checkSubjects.rows.every(
              (subj) => subj.school_id !== school_id
            )
            if (isNotAValidSubject)
              return res.status(412).json({
                message: "Invalid subjects selected",
                code: "412",
                data: {},
              })
            return saveStaff(
              res,
              school_id,
              staff_type,
              net_salary,
              position,
              accessible_subjects,
              date_joined,
              firstname,
              lastname,
              email,
              phone,
              password,
              gender,
              passport_photo
            )
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
  const CheckStaffUsingId = async (staffId) => {
    try {
      const staff = await pool.query(GETSTAFF, [staffId])
      return staff
    } finally {
      console.log(true)
    }
  }
  const UpdateStaffAccount = async (
    staff_id,
    firstname,
    lastname,
    email,
    phone,
    gender,
    timestamp
  ) => {
    try {
      const update = await pool.query(UPDATE_ACCOUNT, [
        firstname,
        lastname,
        email,
        phone,
        gender,
        timestamp,
        staff_id,
      ])
      return update
    } finally {
      console.log(true)
    }
  }
  const UpdateStaffDetail = async (
    staff_id,
    staff_type,
    net_salary,
    position,
    accessible_subjects,
    date_joined,
    timestamp,
    passportId,
    passportUrl
  ) => {
    try {
      const update = await pool.query(UPDATE_STAFF, [
        staff_type,
        net_salary,
        position,
        accessible_subjects,
        date_joined,
        timestamp,
        passportId,
        passportUrl,
        staff_id,
      ])
      return update
    } finally {
      console.log(true)
    }
  }
  const alterStaff = (
    res,
    existing_data,
    staff_id,
    staff_type,
    net_salary,
    position,
    accessible_subjects,
    date_joined,
    firstname,
    lastname,
    email,
    phone,
    gender,
    passport_photo
  ) => {
    const timestamp = new Date().toISOString()
    const dataObj = {
      id: staff_id,
      firstname,
      lastname,
      email,
      phone,
      gender,
      staff_detail: {
        staff_no: existing_data.staff_no,
        staff_type,
        position,
        date_joined,
        net_salary,
        accessible_subjects:
          accessible_subjects.length === 0 ? [] : accessible_subjects,
      },
      created_at: timestamp,
      updated_at: timestamp,
    }
    const update = async () => {
      try {
        const truePhoto = passport_photo.split(",", 2).length
        const passportUpload =
          truePhoto !== 2
            ? null
            : await ImageStorage(
                existing_data.photo_id,
                passport_photo,
                "staff"
              )
        const passportId = !passportUpload
          ? existing_data.photo_id
          : passportUpload.photo_id
        const passportUrl = !passportUpload
          ? existing_data.photo_url
          : passportUpload.secure_url
        await UpdateStaffDetail(
          staff_id,
          staff_type,
          net_salary,
          position,
          accessible_subjects,
          date_joined,
          timestamp,
          passportId,
          passportUrl
        )
        const subjects =
          accessible_subjects.length > 0
            ? await FetchSubjects(accessible_subjects)
            : null
        dataObj.staff_detail.accessible_subjects = !subjects
          ? []
          : [...subjects.rows]
        if (
          existing_data.firstname === firstname &&
          existing_data.lastname === lastname &&
          existing_data.email === email &&
          existing_data.phone === phone &&
          existing_data.gender === gender
        )
          return res.status(200).json({
            message: "Staff member data updated successfully",
            code: "200",
            data: { ...dataObj, passport_photo: passportUrl, photo_id: null },
          })
        await UpdateStaffAccount(
          staff_id,
          firstname,
          lastname,
          email,
          phone,
          gender,
          timestamp
        )
        return res.status(200).json({
          message: "Staff member data updated successfully",
          code: "200",
          data: { ...dataObj, passport_photo: passportUrl, photo_id: null },
        })
      } catch (error) {
        return res.status(500).json({ message: WSWW, code: "500", data: {} })
      }
    }
    return update()
  }
  const updateStaff = (req, res) => {
    let {
      staff_id,
      staff_type,
      net_salary,
      position,
      accessible_subjects,
      date_joined,
      firstname,
      lastname,
      email,
      phone,
      gender,
      passport_photo,
    } = req.body
    const expected_payload = [
      "staff_id",
      "staff_type",
      "net_salary",
      "position",
      "accessible_subjects",
      "date_joined",
      "firstname",
      "lastname",
      "email",
      "phone",
      "gender",
      "passport_photo",
    ]
    const checkPayload = isTrueBodyStructure(req.body, expected_payload)
    if (!checkPayload)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const password = "newPassword@1234_"
    req.body = {
      ...req.body,
      school_id: new ObjectId().toString(),
      password,
      password_confirmation: password,
    }
    const validate = staffValidator(req.body, async () => {
      try {
        const staff = await CheckStaffUsingId(staff_id)
        if (staff.rowCount === 0)
          return res
            .status(412)
            .json({ message: "No records found", code: "412", data: {} })
        const staffData = staff.rows[0]
        phone = cleanExcessWhiteSpaces(phone)
        // firstname = cleanSCW(firstname)
        // lastname = cleanSCW(lastname)
        staff_type = cleanExcessWhiteSpaces(staff_type)
        // position = cleanSCW(position)
        gender = cleanExcessWhiteSpaces(gender).toLowerCase()
        return extract(staffData.school_id, req, res, async () => {
          const checkData = await CheckStaffPresence(email, phone)
          if (checkData.rowCount === 0)
            return alterStaff(
              res,
              staffData,
              staff_id,
              staff_type,
              net_salary,
              position,
              accessible_subjects,
              date_joined,
              firstname,
              lastname,
              email,
              phone,
              gender,
              passport_photo
            )
          const isNotMine = checkData.rows.some((item) => item.id !== staff_id)
          if (isNotMine)
            return res.status(412).json({
              message: "Email or phone has been taken",
              code: "412",
              data: {},
            })
          return alterStaff(
            res,
            staffData,
            staff_id,
            staff_type,
            net_salary,
            position,
            accessible_subjects,
            date_joined,
            firstname,
            lastname,
            email,
            phone,
            gender,
            passport_photo
          )
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
  const fetchStaff = (req, res) => {
    const params = new URLSearchParams(url.parse(req.url, true).query)
    if (!params.get("school_id"))
      return res.status(200).json({ message: "", code: "200", data: {} })
    const school_id = params.get("school_id")
    if (!school_id.match(MONGOOBJECT))
      return res.status(200).json({ message: "", code: "200", data: {} })
    const { pageSize, offset, page } = Pagination().Setter(params, 1, 10)
    getPageParams(pageSize, "staff", `school_id = '${school_id}'`)
      .then((countData) => {
        pool
          .query(PAGINATED_STAFF, [school_id, pageSize, offset])
          .then((staff) => {
            return res.status(200).json({
              message: "",
              code: "200",
              data: {
                staff: staff.rows,
                page_data: {
                  ...countData,
                  currentPage: page,
                  pageSize,
                },
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
        return res.status(500).json({ message: WSWW, code: "500", data: {} })
      })
  }
  const fetchStaffMember = (req, res) => {
    const params = new URLSearchParams(url.parse(req.url, true).query)
    if (!params.get("staff_id"))
      return res.status(200).json({ message: "", code: "200", data: {} })
    const staff_id = params.get("staff_id")
    if (!staff_id.match(MONGOOBJECT))
      return res.status(200).json({ message: "", code: "200", data: {} })
    pool
      .query(GETSTAFF, [staff_id])
      .then(async (result) => {
        if (result.rowCount === 0)
          return res.status(200).json({ message: "", code: "200", data: {} })
        const data = {
          ...result.rows[0],
          id: staff_id,
          school_id: undefined,
          photo_id: null,
        }
        if (data.accessible_subjects.length === 0)
          return res
            .status(200)
            .json({ message: "", code: "200", data: { ...data } })
        try {
          const subjects = await FetchSubjects(data.accessible_subjects)
          const subj_list = subjects.rows
          return res.status(200).json({
            message: "",
            code: "200",
            data: { ...data, accessible_subjects: [...subj_list] },
          })
        } catch (error) {
          return res.status(200).json({
            message: "",
            code: "200",
            data: { ...data, accessible_subjects: [] },
          })
        }
      })
      .catch((err) => {
        return res.status(500).json({ message: WSWW, code: "500", data: {} })
      })
  }
  const searchStaff = (req, res) => {
    const params = new URLSearchParams(url.parse(req.url, true).query)
    if (!params.get("school_id") || !params.get("q"))
      return res.status(200).json({ message: "", code: "200", data: {} })
    const school_id = params.get("school_id")
    const { pageSize, page } = Pagination().Setter(params, 1, 10)
    const q = cleanExcessWhiteSpaces(params.get("q")).toLowerCase()
    if (!school_id.toString().match(MONGOOBJECT))
      return res.status(200).json({ message: "", code: "200", data: {} })
    pool
      .query(STAFFBYSCHOOL_ID, [school_id])
      .then((results) => {
        const data = results.rows.filter((item) =>
          JSON.stringify(item).toLowerCase().includes(q)
        )
        const { total_pages, search_results, total_items } = localPaginator(
          data,
          pageSize,
          page
        )
        return res.status(200).json({
          message: "",
          code: "200",
          data: {
            staff: [...search_results],
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
  const deleteStaff = async (req, res) => {
    const params = new URLSearchParams(url.parse(req.url, true).query)
    if (!params.get("staff_id"))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const staff_id = params.get("staff_id")
    if (!staff_id.match(MONGOOBJECT))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    try {
      const staff = await CheckStaffUsingId(staff_id)
      if (staff.rowCount === 0)
        return res
          .status(412)
          .json({ message: "No records found", code: "412", data: {} })
      const data = staff.rows[0]
      return extract(data.school_id, req, res, async () => {
        try {
          await pool.query(DELETESTAFF, [staff_id])
          await ImageDestroy(data.photo_id)
          return res.status(200).json({
            message: "Staff member removed successfully",
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
  const dataCounter = async (req, res) => {
    const params = new URLSearchParams(url.parse(req.url, true).query)
    let structure = {
      totalStaff: 0,
      totalAcademicStaff: 0,
      totalNonAcademicStaff: 0,
      totalFemaleStaff: 0,
      totalMaleStaff: 0,
    }
    if (!params.get("school_id"))
      return res
        .status(200)
        .json({ message: "", code: "200", data: { ...structure } })
    const school_id = params.get("school_id")
    if (!school_id.match(MONGOOBJECT))
      return res
        .status(200)
        .json({ message: "", code: "200", data: { ...structure } })
    try {
      const counter = await pool.query(STAFFCOUNTER, [school_id, 5])
      const data = counter.rows
      structure = {
        ...structure,
        totalStaff: data.length,
        totalAcademicStaff: data.filter(
          (item) => item.staff_type.toLowerCase() === "academic"
        ).length,
        totalNonAcademicStaff: data.filter(
          (item) => item.staff_type.toLowerCase() === "non-academic"
        ).length,
        totalFemaleStaff: data.filter(
          (item) => item.gender.toLowerCase() === "female"
        ).length,
        totalMaleStaff: data.filter(
          (item) => item.gender.toLowerCase() === "male"
        ).length,
      }
      return res
        .status(200)
        .json({ message: "", code: "200", data: { ...structure } })
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }

  return {
    createStaff,
    updateStaff,
    fetchStaff,
    fetchStaffMember,
    searchStaff,
    deleteStaff,
    dataCounter,
  }
}
