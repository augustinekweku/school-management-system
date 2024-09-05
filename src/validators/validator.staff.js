import { Regex } from "../utils/static/index.js"
import StringManipulators from "../utils/algos/StringManipulators.js"
import moment from "moment"

export default function StaffValidations() {
  const { ALPHA, PASSWORD, EMAIL, NUMERICAL, MONGOOBJECT, ISBASE64 } = Regex
  const { cleanExcessWhiteSpaces } = StringManipulators()
  const staffValidator = (data, next) => {
    const {
      school_id,
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
      password,
      gender,
      password_confirmation,
      passport_photo,
    } = data
    if (!school_id.match(MONGOOBJECT) || !staff_id.match(MONGOOBJECT))
      return { error: "Bad request" }
    // if (!firstname.match(ALPHA) || !lastname.match(ALPHA)) return { error: 'Only English alphabets and whitespaces allowed for names' }
    if (!password.match(PASSWORD))
      return { error: "Password must contain alphanumeric and special chars" }
    if (!email.match(EMAIL)) return { error: "Incorrect email address" }
    if (
      !phone.match(NUMERICAL) ||
      cleanExcessWhiteSpaces(phone).length !== 10 ||
      parseInt(cleanExcessWhiteSpaces(phone).charAt(0)) !== 0
    )
      return {
        error:
          "Phone number must be a numerical string of 10 chars, starting with 0",
      }
    if (
      firstname.length < 3 ||
      firstname.length > 100 ||
      lastname.length < 3 ||
      lastname.length > 100
    )
      return {
        error: "Firstname and lastname must be in the range of 3 to 100 chars",
      }
    if (password.length < 8)
      return { error: "Password must be of at least 8 chars" }
    if (password !== password_confirmation)
      return { error: "Passwords do not match" }
    if (!["male", "female"].includes(gender.toLowerCase()))
      return { error: "Gender rejected" }
    // if (!["academic", "non-academic"].includes(staff_type.toLowerCase()))
    //   return { error: "Staff type rejected" }

    if (!["accountant", "teacher"].includes(position.toLowerCase()))
      return { error: "Selected position is not valid" }
    const isValidDate = moment(date_joined, true).isValid()
    const netSalaryIsBlank = cleanExcessWhiteSpaces(net_salary).length === 0
    const isFutureDate = moment(date_joined).isAfter(
      moment(new Date().toISOString()),
      "day"
    )
    const isValidSubjectIds =
      accessible_subjects.length > 0 &&
      accessible_subjects.filter((item) => !item.match(MONGOOBJECT)).length > 0
    if (!isValidDate) return { error: "Incorrect date format" }
    if (isFutureDate) return { error: "Cannot select a date from the future" }
    if (!netSalaryIsBlank) {
      if (!net_salary.match(NUMERICAL))
        return { error: "Unexpected chars found in net salary field" }
    }
    if (isValidSubjectIds) return { error: "Invalid subjects selected" }
    const photo_parts = passport_photo.split(",", 2)
    if (photo_parts.length === 2) {
      const photo_ext = photo_parts[0]
      const photo_data = photo_parts[1]
      if (!photo_data.match(ISBASE64))
        return { error: "No passport photo found" }
      if (
        photo_ext !== "data:image/png;base64" &&
        photo_ext !== "data:image/jpeg;base64" &&
        photo_ext !== "data:image/jpg;base64"
      )
        return {
          error: "Photo type is unaccepted. Choose jpeg, jpg, png files only.",
        }
    }
    next()
  }

  return {
    staffValidator,
  }
}
