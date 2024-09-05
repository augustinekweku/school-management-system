export const App_Object = {
  name: "Eduminfo App",
}
export const Regex = {
  PASSWORD:
    /^(?=(.*[a-z]){1,})(?=(.*[A-Z]){1,})(?=(.*[0-9]){1,})(?=(.*['"{}|:;<>,?!@#$%^&*()\-__+.]){1,}).{8,}$/,
  EMAIL: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
  NUMERICAL: /^[0-9]+$/,
  ALPHA: /^[ A-Za-z'-]*$/,
  ALPHANUMERIC: /^([a-zA-Z0-9 _-]+)$/,
  MONGOOBJECT: /^[0-9a-fA-F]{24}$/,
  SPECIALCHARS: /\W|_/g,
  CSVDOT_HYPHEN: /^[a-zA-Z0-9 .,-]{0,150}$/,
  ISBASE64:
    /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/,
  ISACADEMICYEAR: /^\d{4}-\d{4}$/,
  UNEXPECTED_ATTR: /[^\w\s]/gi,
  WHITESPACES: /\s{2,}/g,
  DECIMAL_NUM: /^\d+(\.\d{1,3})?$/,
}
export const Grades = [
  { id: 1, grade: "A", low_mark: 90, high_grade: 100, remark: "Excellent" },
  { id: 2, grade: "B", low_mark: 80, high_grade: 89, remark: "Very good" },
  { id: 3, grade: "C", low_mark: 70, high_grade: 79, remark: "Good" },
  { id: 4, grade: "D", low_mark: 60, high_grade: 69, remark: "Credit" },
  { id: 5, grade: "E", low_mark: 50, high_grade: 59, remark: "Pass" },
  { id: 6, grade: "F", low_mark: 0, high_grade: 49, remark: "Fail" },
]
export const SUCCESSFULREGISTRATIONCOOKIE = {
  origin: "http://localhost:5173",
  maxAge: 1800000,
  secure: true,
  sameSite: "none",
}
export const OTPCONFIRMATIONCOOKIE = {
  origin: "http://localhost:5173",
  maxAge: 180000,
  secure: true,
  sameSite: "none",
}
export const TOKENCOOKIECONFIG = {
  origin: "http://localhost:5173",
  maxAge: 7200000,
  secure: true,
  httpOnly: true,
  sameSite: "none",
}
export const TOKENTRACKERCOOKIECONFIG = {
  origin: "http://localhost:5173",
  maxAge: 7200000,
  secure: true,
  sameSite: "none",
}
export const Numerical_Entity = {
  USERTYPE: [1, 2, 3], // 1 => parent, 2 => sch_admin, 3 => super admin
  TWOINARRAY: [1, 2], // true or false datatype
  THREEINARRAY: [1, 2, 3],
}
export const ArrayData = {
  relationshipArray: ["father", "mother", "guardian", ""],
  genderArray: ["male", "female"],
}
export const Messages = {
  General: {
    WSWW: "Whoops! Something went wrong",
    BRS: "Bad request received",
    SNRF: "Sorry, no records found",
  },
  Mails: {
    VERIFICATION_SUBJECT: "User Account Verification",
    PASSWORDRECOVERY_SUBJECT: "Password Reset",
    TEMPLATE_SIGNATURE: "School Management System Team",
    DEFAULT_USERNAME: "Dear User",
    OTP_SUBJECT: "OTP Verification",
  },
  Users: {
    SRMESS:
      "Successful registration, please continue to verify your account by following the link sent to your phone.",
    ARF: "Account has been verified already",
    SFPLS: "We sent a new link to your phone, please check to continue.",
    IVLF: "Invalid account verification link",
    AVS: "Account verified successfully",
    PRLSS: "Follow the link sent to your phone to reset your password.",
  },
}
