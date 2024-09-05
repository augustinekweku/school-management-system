import * as JWT from "jsonwebtoken"

export default function RequestInformation(req, res) {
  const { verify } = JWT.default
  const authorizer = req.headers["authorization"]
  let userObj = {}
  if (typeof authorizer === "undefined") return userObj
  const bearer = authorizer.split(" ", 2)
  if (bearer.length !== 2) return userObj
  const token = bearer[1]
  verify(token, process.env.SMS_JWT_SECRET, async (err, decoded) => {
    if (err) return userObj
    if (typeof decoded === "undefined") return userObj
    userObj = { ...decoded }
  })
  return userObj
}
