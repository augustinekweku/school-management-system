import { ObjectId } from "bson"
import DatabaseConnection from "../../../config/config.db.js"
import PhotoUploader from "../../../helpers/helper.photo_uploader.js"
import RequestBodyChecker from "../../../helpers/helper.request_checker.js"
import RequestInformation from "../../../middlewares/middleware.request_info.js"
import {
  countPreviouslyPaidFees,
  feeQuery,
  getParentPhoneNumberQuery,
  lastPaymentBalance,
  savePaymentDetailQuery,
  studentQuery,
} from "../../../queries/query.fees.js"
import { Regex } from "../../../utils/static/index.js"
import axios from "axios"

const { pool } = DatabaseConnection()

const generateTxnRef = (rowId, append) => {
  const dateObj = new Date()
  const day = dateObj.getDay()
  const date = dateObj.getDate()
  const month = dateObj.getMonth()
  const year = dateObj.getFullYear()

  const txnRef = `${day}${date}${month}${year}${rowId}${append}`
  return Number(txnRef)
}

const StudentFeePayment = async (req, res) => {
  const { isTrueBodyStructure } = RequestBodyChecker()
  const tokenData = RequestInformation(req, res)
  const { ImageStorage } = PhotoUploader()
  const expected_payload = ["fee_id", "student_id", "amount", "receipt_img"]
  const checkPayload = isTrueBodyStructure(req.body, expected_payload)
  if (!checkPayload)
    return res
      .status(400)
      .json({ message: "Bad request", code: "400", data: {} })
  const payload = req.body

  const tokenKeysArray = Object.keys(tokenData)
  if (!tokenKeysArray.includes("user_id"))
    return res
      .status(412)
      .json({ message: "Authentication is required", code: "412", data: {} })

  if (
    !Regex.MONGOOBJECT.test(payload.fee_id) ||
    !Regex.MONGOOBJECT.test(payload.student_id) ||
    !Regex.DECIMAL_NUM.test(payload.amount)
  )
    return res
      .status(400)
      .json({ message: "Bad request", code: "400", data: {} })

  //   validate the provided receipt image

  const receiptImage = payload.receipt_img

  if (typeof receiptImage === "string") {
    const photo_parts = receiptImage.split(",", 2)
    if (photo_parts.length === 2) {
      const photo_ext = photo_parts[0]
      const photo_data = photo_parts[1]
      if (!photo_data.match(Regex.ISBASE64))
        return res.status(412).json({
          message: "Selected image is does not reflect a true image",
          code: "412",
          data: {},
        })
      if (
        photo_ext !== "data:image/png;base64" &&
        photo_ext !== "data:image/jpeg;base64" &&
        photo_ext !== "data:image/jpg;base64"
      )
        return res.status(412).json({
          message:
            "Photo type is unaccepted. Choose jpeg, jpg or png files only.",
          code: "412",
          data: {},
        })
    }
  }
  try {
    // concurrently query and check for accuracy of the fee_id and student_id
    const [feeData, studentData, lastPaymentRecord, previouslyPaidFeesCount] =
      await Promise.all([
        pool.query(feeQuery, [payload.fee_id]),
        pool.query(studentQuery, [payload.student_id]),
        pool.query(lastPaymentBalance, [payload.student_id]),
        pool.query(countPreviouslyPaidFees, [
          payload.fee_id,
          payload.student_id,
        ]),
      ])

    if (!feeData.rowCount || !studentData.rowCount)
      return res
        .status(412)
        .json({ message: "No records found", code: "412", data: {} })

    const feeProperties = feeData.rows[0]
    const studentDetails = studentData.rows[0]
    // compare ownership by matching school_ids
    if (feeProperties.school_id !== studentDetails.school_id)
      return res.status(412).json({
        message: "Cannot access the requested resources",
        code: "412",
        data: {},
      })
    const feeItemsArray = feeProperties.fee_data

    // check if the selected fee item is payable by the student
    const classesArray = feeProperties.classes

    if (!classesArray.includes(studentDetails.current_class))
      return res.status(412).json({
        message:
          "The selected fee items are not payable by the selected student",
        code: "412",
        data: {},
      })

    // calculate the total fee amount
    let totalFeeAmount = 0
    for (let i = 0; i < feeItemsArray.length; i++) {
      const feeItem = feeItemsArray[i]
      totalFeeAmount = totalFeeAmount + Number(feeItem.amount)
    }

    totalFeeAmount = Number(totalFeeAmount.toFixed(2))

    // get balance from the last payment
    const lastPaymentData = lastPaymentRecord.rows
    const balanceFromLastPayment = !lastPaymentData.length
      ? 0
      : Number(lastPaymentData[0].balance)

    if (lastPaymentData.length) {
      if (
        lastPaymentData[0].fee_id === payload.fee_id &&
        balanceFromLastPayment >= 0
      )
        return res.status(412).json({
          message: "Student has fully paid the selected fee",
          code: "412",
          data: {},
        })
    }

    // calculate the total payable fee
    const payableAmount = !lastPaymentData.length
      ? totalFeeAmount
      : lastPaymentData[0].fee_id === payload.fee_id
      ? Math.abs(balanceFromLastPayment)
      : totalFeeAmount - balanceFromLastPayment

    // calculate the total available funds for the student
    const studentAvailableFund =
      Number(payload.amount) +
      (balanceFromLastPayment < 0 ? 0 : balanceFromLastPayment)

    // calculate the new balance
    const isArrears = payableAmount > studentAvailableFund
    let newBalance = payableAmount - studentAvailableFund

    newBalance =
      newBalance === 0
        ? 0
        : !isArrears
        ? Math.abs(newBalance)
        : newBalance > 0
        ? newBalance * -1
        : newBalance
    newBalance = Number(newBalance.toFixed(2))

    //   upload receipt image when provided
    const truePhotoProvided = receiptImage.split(",", 2).length
    const receiptUpload =
      truePhotoProvided !== 2
        ? null
        : await ImageStorage(null, receiptImage, "payment_receipts")
    const receiptImageId = !receiptUpload ? null : receiptUpload.photo_id
    const receiptImageUrl = !receiptUpload ? null : receiptUpload.secure_url

    // generate the reference id for the transaction
    const txnReferenceAppend = !lastPaymentData.length
      ? 1
      : lastPaymentData[0].fee_id !== payload.fee_id
      ? 1
      : Number(previouslyPaidFeesCount.rows[0].paid_count) + 1

    const txnRef = generateTxnRef(studentDetails.row_id, txnReferenceAppend)

    const paymentHistoryPayload = {
      id: new ObjectId().toString(),
      student_id: payload.student_id,
      fee_id: payload.fee_id,
      amount_paid: Number(Number(payload.amount).toFixed(2)),
      receipt_img: receiptImageUrl,
      receipt_img_id: receiptImageId,
      payment_confirmed_by: tokenData.user_id,
      transaction_ref: txnRef,
      created_at: new Date().toISOString(),
      balance: newBalance,
    }

    const savePayment = await pool.query(savePaymentDetailQuery, [
      paymentHistoryPayload.id,
      paymentHistoryPayload.student_id,
      paymentHistoryPayload.fee_id,
      paymentHistoryPayload.amount_paid,
      paymentHistoryPayload.receipt_img,
      paymentHistoryPayload.receipt_img_id,
      paymentHistoryPayload.payment_confirmed_by,
      paymentHistoryPayload.transaction_ref,
      paymentHistoryPayload.created_at,
      paymentHistoryPayload.balance,
    ])

    if (!savePayment.rowCount)
      return res
        .status(412)
        .json({ message: "Fee payment has failed", code: "412", data: {} })

    const getParentPhone = await pool.query(getParentPhoneNumberQuery, [
      payload.student_id,
    ])

    if (!getParentPhone.rowCount)
      return res.status(412).json({
        message:
          "Fees payment was successful. Please update parent's phone number to always receive notification",
        code: "200",
        data: {},
      })

    res.status(412).json({
      message: "Fees payment was successful",
      code: "200",
      data: {},
    })

    // send notification to student's parent
    const phoneData = getParentPhone.rows.map((row) =>
      parseInt(row.phone).toString()
    )
    const feePeriod = `${feeProperties.acad_year} academic year${
      !feeProperties.term_name ? "" : ` [${feeProperties.term_name}]`
    }`
    const balanceType = newBalance < 0 ? "an arrears of" : "a balance of"
    const smsPayload = {
      sender: process.env.SMS_MESSENGER_NAME,
      message: `Good day Sir/Madam, We have successfully received your payment of ${paymentHistoryPayload.amount_paid.toLocaleString(
        "en-US",
        { style: "currency", currency: "ghs" }
      )} in the name of [${studentDetails.firstname}, ${
        studentDetails.index_no
      }] as the school fees for the ${feePeriod}. You now have ${balanceType} ${Math.abs(
        newBalance
      ).toLocaleString("en-US", {
        style: "currency",
        currency: "ghs",
      })}. Best regards.`,
      recipients: [...phoneData],
    }

    return await axios({
      method: "POST",
      url: process.env.SMS_MESSENGER_URL,
      headers: {
        "api-key": process.env.SMS_MESSENGER_API_KEY,
      },
      data: smsPayload,
    })
  } catch (error) {
    return res.status(500).json({
      message: "Whoops! Something went wrong",
      code: "500",
      data: {},
    })
  }
}
export default StudentFeePayment
