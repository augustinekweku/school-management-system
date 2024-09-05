import { compareSync, genSaltSync, hashSync } from "bcrypt"
import DatabaseConnection from "../config/config.db.js"
import UserQueries from "../queries/query.user.js"
import StringManipulators from "../utils/algos/StringManipulators.js"
import { Messages, Regex } from "../utils/static/index.js"
import UserValidator from "../validators/validator.user.js"
import SchoolQueries from "../queries/query.school.js"
import { ObjectId } from "bson"
import { v4 as uniqueString } from "uuid"
import needle from "needle"
import moment from "moment"
import GoogleBotChecker from "../utils/algos/GoogleBotChecker.js"
import * as JWT from "jsonwebtoken"
import RequestInformation from "../middlewares/middleware.request_info.js"
import RequestBodyChecker from "../helpers/helper.request_checker.js"
import useSignUpMailer from "../helpers/mail/authentication/mail.sign-up.js"
import useSignInMailer from "../helpers/mail/authentication/mail.sign-in.js"

export default function UserControllers() {
  const { pool } = DatabaseConnection()
  const { makeSluggish, cleanSCW, cleanExcessWhiteSpaces } =
    StringManipulators()
  const { isTrueBodyStructure } = RequestBodyChecker()
  const {
    validateRegistration,
    passwordResetValidator,
    otpValidator,
    loginValidator,
  } = UserValidator()
  const SALT = genSaltSync(10)
  const { WSWW, BRS, SNRF } = Messages.General
  const {
    CHECKDATA,
    CREATEUSER,
    PUTVCODE,
    DELETEACCOUNT,
    CHECKPHONE,
    DELETEVERIFICATIONS,
    GETLINK,
    VERIFYUSER,
    DELETEPASSWORDRESETS,
    REGISTERPASSWORDRESET,
    GETPASSWORDRESET,
    REMOVEPASSWORDRESET,
    UPDATEPASSWORD,
    GETUSER,
    CHECKEMAIL,
    GETSCHOOLFORUSER,
    SAVEROLES,
  } = UserQueries()
  const { SAVESCHINFO, CHECK_REQUIRED_ENTRIES } = SchoolQueries()
  const { ARF, SFPLS, IVLF, AVS, PRLSS } = Messages.Users
  const { NUMERICAL, MONGOOBJECT, EMAIL } = Regex
  const { sign } = JWT.default
  const removeAccount = async (user_id, res) => {
    try {
      await pool.query(DELETEACCOUNT, [user_id])
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }
  const createAccount = (req, res) => {
    let {
      firstname,
      lastname,
      email,
      gender,
      phone,
      password,
      school_name,
      school_country,
    } = req.body
    const expected_payload = [
      "firstname",
      "lastname",
      "email",
      "gender",
      "phone",
      "password",
      "password_confirmation",
      "school_name",
      "school_country",
    ]
    const checkPayload = isTrueBodyStructure(req.body, expected_payload)
    if (!checkPayload)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const validate = validateRegistration(req.body, async () => {
      try {
        gender = gender.trim().toLowerCase()
        password = hashSync(password, SALT)
        school_country = cleanSCW(school_country)
        phone = cleanExcessWhiteSpaces(phone)
        const result = await pool.query(CHECKDATA, [email, phone])
        if (result.rowCount > 0)
          return res.status(412).json({
            message: "Email or phone has been taken",
            code: "412",
            data: {},
          })
        const timestamp = new Date().toISOString()
        const user_id = new ObjectId().toString()
        await pool.query(CREATEUSER, [
          firstname,
          lastname,
          email,
          gender,
          phone,
          password,
          timestamp,
          user_id,
        ])
        const slug = `${makeSluggish(school_name)}-${new ObjectId().toString()}`
        const school_id = new ObjectId().toString()
        const roles = []
        await pool.query(SAVESCHINFO, [
          user_id,
          school_name,
          slug,
          school_country,
          timestamp,
          school_id,
        ])
        await pool.query(SAVEROLES, [user_id, school_id, roles])
        const verificationCode = uniqueString()
        const hashedCode = hashSync(verificationCode, SALT)
        const saveVerificationCode = await pool.query(PUTVCODE, [
          user_id,
          hashedCode,
          timestamp,
          new ObjectId().toString(),
        ])
        if (saveVerificationCode.rowCount !== 1)
          return removeAccount(user_id, res)
        res.status(201).json({
          message:
            "Successful registration, please continue to verify your account by following the link sent to your email address.",
          code: "201",
          data: {
            new_account: {
              firstname,
              lastname,
              email,
              phone,
              user_id,
              created_at: timestamp,
              updated_at: timestamp,
            },
            school_info: {
              id: school_id,
              name: school_name,
              country: school_country,
              slug,
            },
          },
        })
        return await useSignUpMailer({
          firstname,
          lastname,
          link: `${process.env.SMS_CLIENT_URL}register/verify?code=${verificationCode}&user=${user_id}`,
          email,
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
  const resendLink = async (req, res) => {
    const { id, email } = req.body
    const expected_payload = ["id", "email"]
    const checkPayload = isTrueBodyStructure(req.body, expected_payload)
    if (!checkPayload)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    if (!email.match(EMAIL))
      return res
        .status(400)
        .json({ message: "Incorrect email address", code: "400", data: {} })

    try {
      const getUser = await pool.query(GETUSER, [id])
      if (getUser.rowCount === 0)
        return res.status(412).json({
          message: "Account could not found on the server",
          code: "412",
          data: {},
        })
      const user = getUser.rows[0]
      if (user.email !== email)
        return res.status(412).json({
          message: "Incorrect user account email address",
          code: "412",
          data: {},
        })
      if (user.verified)
        return res.status(412).json({
          message: "Account has been verified already",
          code: "412",
          data: {},
        })

      const code = uniqueString()
      const timestamp = new Date().toISOString()

      const hashedCode = hashSync(code, SALT)
      await pool.query(DELETEVERIFICATIONS, [user.id])
      const saveVerificationCode = await pool.query(PUTVCODE, [
        user.id,
        hashedCode,
        timestamp,
        new ObjectId().toString(),
      ])
      if (saveVerificationCode.rowCount !== 1)
        return res.status(412).json({
          message: "Could not resend the verification link",
          code: "412",
          data: {},
        })

      const { password, verified, usertype, row_id, ...restUserData } = user
      res.status(200).json({
        message: "Verification link sent successfully",
        code: "200",
        data: {
          ...restUserData,
        },
      })

      return await useSignUpMailer({
        firstname,
        lastname,
        link: `${process.env.SMS_CLIENT_URL}register/verify?code=${verificationCode}&user=${user_id}`,
        email,
      })
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }
  const accountVerification = (req, res) => {
    const { code, user } = req.body
    const expected_payload = ["code", "user"]
    const checkPayload = isTrueBodyStructure(req.body, expected_payload)
    if (!checkPayload)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    if (!user.toString().match(MONGOOBJECT))
      return res.status(400).json({ message: BRS, code: "400", data: {} })
    pool
      .query(GETLINK, [user])
      .then((result) => {
        if (result.rowCount !== 1)
          return res.status(404).json({ message: SNRF, code: "404", data: {} })
        const data = result.rows[0]
        if (data.verified)
          return res.status(412).json({ message: ARF, code: "412", data: {} })
        const compareCode = compareSync(code, data.code)
        if (!compareCode)
          return res.status(412).json({ message: IVLF, code: "412", data: {} })
        const registrationDate = moment(data.created_at),
          currentTime = moment(new Date().toISOString()),
          diffTime = currentTime.diff(registrationDate, "minutes"),
          verificationCode = uniqueString(),
          hashedCode = hashSync(verificationCode, SALT),
          timestamp = new Date().toISOString()
        if (diffTime <= 1440) {
          return pool
            .query(VERIFYUSER, [true, user])
            .then((response) => {
              pool
                .query(DELETEVERIFICATIONS, [user])
                .catch((err) => console.warn(err))
              return res
                .status(200)
                .json({ message: AVS, code: "200", data: {} })
            })
            .catch((err) => {
              return res
                .status(500)
                .json({ message: WSWW, code: "500", data: {} })
            })
        }
        pool
          .query(DELETEVERIFICATIONS, [user])
          .then((result) => {
            pool
              .query(PUTVCODE, [
                user,
                hashedCode,
                timestamp,
                new ObjectId().toString(),
              ])
              .then(async (done) => {
                res.status(200).json({ message: SFPLS, code: "200", data: {} })
                return await useSignUpMailer({
                  firstname: data.firstname,
                  lastname: data.lastname,
                  link: `${process.env.SMS_CLIENT_URL}register/verify?code=${verificationCode}&user=${user}`,
                  email: data.email,
                })
              })
              .catch((err) => {
                return removeAccount(user, res)
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
  const passwordRecovery = async (req, res) => {
    const { phone, captcha } = req.body
    const expected_payload = ["phone", "captcha"]
    const checkPayload = isTrueBodyStructure(req.body, expected_payload)
    if (!checkPayload)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    if (
      !phone.match(NUMERICAL) ||
      cleanExcessWhiteSpaces(phone).length !== 10 ||
      parseInt(cleanExcessWhiteSpaces(phone).charAt(0)) !== 0
    )
      return res.status(400).json({
        message:
          "Phone number must be a numerical string of 10 chars, starting with 0",
        code: "400",
        data: {},
      })
    return await GoogleBotChecker(req, captcha, () => {
      pool
        .query(CHECKPHONE, [phone])
        .then((result) => {
          if (result.rowCount !== 1)
            return res
              .status(404)
              .json({ message: SNRF, code: "404", data: {} })
          const uniqueCode = uniqueString(),
            hashedCode = hashSync(uniqueCode, SALT),
            userObj = result.rows[0],
            timestamp = new Date().toISOString()
          pool
            .query(DELETEPASSWORDRESETS, [userObj.id])
            .then(() => {
              pool
                .query(REGISTERPASSWORDRESET, [
                  userObj.id,
                  hashedCode,
                  timestamp,
                  new ObjectId().toString(),
                ])
                .then(async (done) => {
                  return await needle(
                    "post",
                    process.env.SMS_MESSENGER_URL,
                    {
                      sender: process.env.SMS_MESSENGER_NAME,
                      message: `Good day, ${userObj.lastname}. Visit ${process.env.SMS_CLIENT_URL}reset-password?code=${uniqueCode}&user=${userObj.id} to reset your password. NOTE: This link is valid for only 1hr. Please ignore this message if you did not initiate this request on ${process.env.SMS_MESSENGER_NAME}. Kindly log into your account and change your password as someone may have guessed your credentials.`,
                      recipients: [`233${parseInt(phone)}`],
                    },
                    {
                      headers: {
                        "api-key": process.env.SMS_MESSENGER_API_KEY,
                        "Content-Type": "application/json",
                      },
                    }
                  )
                    .then((resp) => {
                      return res
                        .status(200)
                        .json({ message: PRLSS, code: "200", data: {} })
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
        .catch((err) => {
          return res.status(500).json({ message: WSWW, code: "500", data: {} })
        })
    })
  }
  const passwordReset = async (req, res) => {
    const { user, code, password, password_confirmation, captcha } = req.body
    const expected_payload = [
      "user",
      "code",
      "password",
      "password_confirmation",
      "captcha",
    ]
    const checkPayload = isTrueBodyStructure(req.body, expected_payload)
    if (!checkPayload)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    return await GoogleBotChecker(req, captcha, () => {
      const reset = passwordResetValidator(
        user,
        code,
        password,
        password_confirmation,
        () => {
          pool
            .query(GETPASSWORDRESET, [user])
            .then((result) => {
              if (result.rowCount === 0)
                return res
                  .status(404)
                  .json({ message: SNRF, code: "404", data: {} })
              const dataObj = result.rows[0],
                compareCode = compareSync(code, dataObj.code)
              if (!compareCode)
                return res.status(412).json({
                  message: "You followed an invalid link",
                  code: "412",
                  data: {},
                })
              const requestTime = moment(dataObj.created_at),
                currentTime = moment(new Date().toISOString()),
                diffTime = currentTime.diff(requestTime, "minutes"),
                hashedPassword = hashSync(password, SALT)
              if (diffTime > 60) {
                pool
                  .query(REMOVEPASSWORDRESET, [user])
                  .catch((err) => console.warn(err))
                return res.status(412).json({
                  message: "You followed an invalid link",
                  code: "412",
                  data: {},
                })
              }
              pool
                .query(UPDATEPASSWORD, [hashedPassword, user])
                .then(() => {
                  pool
                    .query(REMOVEPASSWORDRESET, [user])
                    .catch((err) => console.warn(err))
                  return res.status(200).json({
                    message: "Password updated successfully",
                    code: "200",
                    data: {},
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
        }
      )
      if (reset !== undefined)
        return res
          .status(412)
          .json({ message: reset.error, code: "412", data: {} })
      return reset
    })
  }
  const s1Login = async (req, res) => {
    const { email, password, captcha } = req.body
    const expected_payload = ["email", "password", "captcha"]
    const checkPayload = isTrueBodyStructure(req.body, expected_payload)
    if (!checkPayload)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    if (captcha.length === 0)
      return res.status(400).json({ message: BRS, code: "400", data: {} })
    return await GoogleBotChecker(req, captcha, () => {
      const validate = loginValidator(email, password, async () => {
        try {
          const result = await pool.query(CHECKEMAIL, [email])
          if (result.rowCount !== 1)
            return res.status(404).json({
              message: "Account does not exists on this server",
              code: "404",
              data: {},
            })
          const userObj = result.rows[0]
          if (!userObj.verified)
            return res.status(412).json({
              message: "Cannot sign in with unverified account",
              code: "412",
              data: {},
            })

          const comparePassword = compareSync(password, userObj.password)
          if (!comparePassword)
            return res
              .status(412)
              .json({ message: "Incorrect credentials", code: "412", data: {} })

          let resendToken = sign(
            {
              tk_id: new ObjectId().toString(),
              id: userObj.id,
              tk_exp: new Date().toISOString(),
            },
            process.env.SMS_JWT_SECRET,
            { expiresIn: "6h" }
          )
          resendToken = !resendToken ? undefined : resendToken

          await pool.query("DELETE FROM otps WHERE user_id = $1", [userObj.id])

          let otp = ""
          while (otp.length !== 6) {
            otp = Math.floor(Math.random() * 999999 + 1).toString()
          }

          const hashedOtp = hashSync(otp, SALT)
          const timestamp = new Date().getTime().toString()
          await pool.query(
            "INSERT INTO otps (user_id, otp, issued_at) VALUES ($1, $2, $3)",
            [userObj.id, hashedOtp, timestamp]
          )

          res.status(200).json({
            message:
              "Successfully checked, please check your email inbox to continue.",
            code: "200",
            data: {
              user: {
                ...userObj,
                password: undefined,
                verified: undefined,
                row_id: undefined,
                resend_otp_token: resendToken,
              },
            },
          })

          return await useSignInMailer({
            firstname: userObj.firstname,
            lastname: userObj.lastname,
            otp,
            email: userObj.email,
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
    })
  }
  const s2Login = (req, res) => {
    const { user, otp } = req.body
    const expected_payload = ["user", "otp"]
    const checkPayload = isTrueBodyStructure(req.body, expected_payload)
    if (!checkPayload)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    const confirmLogin = otpValidator(user, otp, async () => {
      try {
        const userResult = await pool.query(GETUSER, [user])
        if (userResult.rowCount !== 1)
          return res
            .status(400)
            .json({ message: "Bad request", code: "400", data: {} })
        const data = userResult.rows[0]
        const getOtp = await pool.query(
          "SELECT otp, issued_at FROM otps WHERE user_id = $1",
          [user]
        )
        if (getOtp.rowCount === 0)
          return res
            .status(412)
            .json({ message: "Could not retrieve data", code: "412", data: {} })
        const otpData = getOtp.rows[0]
        const dbOtp = otpData.otp
        const compareOtp = compareSync(otp, dbOtp)
        if (!compareOtp)
          return res.status(412).json({
            message: "Incorrect verification code",
            code: "412",
            data: {},
          })

        const signedInTimestamp = Number(otpData.issued_at)
        const currentTimestamp = new Date().getTime()
        if (currentTimestamp - signedInTimestamp > 1800000)
          return res.status(412).json({
            message: "Verification code has expired",
            code: "412",
            data: {},
          })

        const signedInUser = {
          user_id: user,
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
          usertype: data.usertype,
          phone: data.phone,
        }
        const token = sign({ ...signedInUser }, process.env.SMS_JWT_SECRET, {
          expiresIn: "2h",
        })
        if (!token)
          return res.status(500).json({ message: WSWW, code: "500", data: {} })

        // Get school data from school or staff
        const schoolIdFromStaffQuery = `SELECT 
          sc.id AS school_id, sc.name AS school_name, sc.slug, sc.country, sc.owner, 
          sc.school_email, sc.motto, sc.address, sc.logo_url, sc.created_at, sc.updated_at 
          FROM staff s INNER JOIN school sc ON s.school_id = sc.id 
          WHERE s.user_id = $1
        `
        // generate school data query
        const getSchoolIdQuery = [
          Number(process.env.SMS_ADMIN),
          Number(process.env.SMS_SUPER_ADMIN),
        ].includes(Number(data.usertype))
          ? GETSCHOOLFORUSER
          : [
              Number(process.env.SMS_TEACHER),
              Number(process.env.SMS_ACCOUNTANT),
            ].includes(Number(data.usertype))
          ? schoolIdFromStaffQuery
          : ""

        const getSchoolData = !getSchoolIdQuery.length
          ? null
          : await pool.query(getSchoolIdQuery, [user])
        const schoolData = !getSchoolData
          ? {}
          : getSchoolData.rowCount !== 1
          ? {}
          : getSchoolData.rows[0]

        // check configuration data for admins

        let isConfigurationComplete = true

        if (
          [
            Number(process.env.SMS_ADMIN),
            Number(process.env.SMS_SUPER_ADMIN),
          ].includes(Number(data.usertype))
        ) {
          const schoolId =
            typeof schoolData["school_id"] !== "undefined"
              ? schoolData["school_id"]
              : ""
          const checkConfigCompletionStatus = await pool.query(
            CHECK_REQUIRED_ENTRIES,
            [schoolId]
          )
          const countsData = checkConfigCompletionStatus.rows[0]
          Object.keys(countsData).map((item) => {
            if (Number(countsData[item]) === 0) isConfigurationComplete = false
          })
          Object.keys(schoolData)
            .filter((col) => col !== "logo_url" && col !== "logo_id")
            .map((item) => {
              if (schoolData[item] === null || schoolData[item] === "")
                isConfigurationComplete = false
            })
        }

        return res.status(200).json({
          message: "Successful login",
          code: "200",
          data: {
            user: { ...signedInUser, token },
            school: { ...schoolData },
            isConfigurationComplete: [
              Number(process.env.SMS_ADMIN),
              Number(process.env.SMS_SUPER_ADMIN),
            ].includes(Number(data.usertype))
              ? isConfigurationComplete
              : undefined,
          },
        })
      } catch (error) {
        return res.status(500).json({ message: WSWW, code: "500", data: {} })
      }
    })
    if (confirmLogin !== undefined)
      return res
        .status(412)
        .json({ message: confirmLogin.error, code: "412", data: {} })
    return confirmLogin
  }
  const resendLoginOTP = async (req, res) => {
    const { user_id, tk_value } = req.body
    const expected_payload = ["user_id", "tk_value"]
    const checkPayload = isTrueBodyStructure(req.body, expected_payload)
    if (!checkPayload)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    if (!user_id.match(MONGOOBJECT))
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    if (tk_value.length === 0)
      return res
        .status(400)
        .json({ message: "Bad request", code: "400", data: {} })
    req.headers["authorization"] = `Bearer ${tk_value}`
    try {
      const user = await pool.query(GETUSER, [user_id])
      if (user.rowCount !== 1)
        return res.status(404).json({
          message: "Account does not exists on this server",
          code: "404",
          data: {},
        })

      const data = user.rows[0]
      if (!data.verified)
        return res.status(412).json({
          message: "Not eligible to request for OTP",
          code: "401",
          data: {},
        })
      const request_info = RequestInformation(req, res)
      if (!Object.keys(request_info).includes("tk_exp"))
        return res.status(401).json({
          message: "Not eligible to request for OTP",
          code: "401",
          data: {},
        })
      const tk_exp = request_info.tk_exp
      if (!moment(tk_exp, true).isValid())
        return res.status(401).json({
          message: "Not eligible to request for OTP",
          code: "401",
          data: {},
        })
      const currentTime = moment(new Date().toISOString()),
        tokenExpTime = moment(tk_exp),
        diff = currentTime.diff(tokenExpTime, "minutes")
      if (diff > 5)
        return res.status(401).json({
          message: "Not eligible to request for OTP",
          code: "401",
          data: {},
        })
      if (request_info.id !== user_id)
        return res.status(401).json({
          message: "Not eligible to request for OTP",
          code: "401",
          data: {},
        })

      await pool.query("DELETE FROM otps WHERE user_id = $1", [user_id])

      let otp = ""
      while (otp.length !== 6) {
        otp = Math.floor(Math.random() * 999999 + 1).toString()
      }

      const hashedOtp = hashSync(otp, SALT)
      const timestamp = new Date().getTime().toString()
      await pool.query(
        "INSERT INTO otps (user_id, otp, issued_at) VALUES ($1, $2, $3)",
        [user_id, hashedOtp, timestamp]
      )

      res.status(200).json({
        message: "OTP was resent. Please check your inbox to continue.",
        code: "200",
        data: {
          user: {
            ...data,
            password: undefined,
            verified: undefined,
            row_id: undefined,
          },
        },
      })

      return await useSignInMailer({
        firstname: data.firstname,
        lastname: data.lastname,
        otp,
        email: data.email,
      })
    } catch (error) {
      return res.status(500).json({ message: WSWW, code: "500", data: {} })
    }
  }
  const verifyAuth = (req, res) => {
    const request_info = RequestInformation(req, res)
    if (Object.keys(request_info).length === 0)
      return res
        .status(401)
        .json({ message: "", code: "401", data: { isAuth: false } })
    return res
      .status(200)
      .json({ message: "", code: "200", data: { isAuth: true } })
  }
  return {
    removeAccount,
    createAccount,
    resendLink,
    accountVerification,
    passwordRecovery,
    passwordReset,
    s2Login,
    s1Login,
    resendLoginOTP,
    verifyAuth,
  }
}
