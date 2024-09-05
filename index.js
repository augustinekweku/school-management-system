import express from "express"
import dotenv from "dotenv"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import cors from "cors"
import { createServer } from "http"
import { App_Object } from "./src/utils/static/index.js"
import userRouter from "./src/routers/router.user.js"
import schoolRoutes from "./src/routers/router.school.js"
import studentRoute from "./src/routers/router.student.js"
import diseaseRouter from "./src/routers/router.disease.js"
import staffRouter from "./src/routers/router.staff.js"
import feesRouter from "./src/routers/router.fees.js"
import academicsRouter from "./src/routers/router.academics.js"
import gradingSystemRouter from "./src/routers/router.grading_system.js"

const app = express(),
  { name } = App_Object
dotenv.config()
const PORT = process.env.PORT || process.env.SMS_PORT
app.use(helmet())
app.use(
  cors({
    origin: [
      "http://localhost:5000",
      "http://localhost:4000",
      "https://www.eduminfo.com",
      "https://eduminfo.com",
      "https://student.eduminfo.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  })
)
app.use(cookieParser())
app.use(express.json({ limit: "5mb" }))

app.get("/", async (req, res) => {
  return res.send(`Welcome to  ${name}`)
})
app.use("/api/users", userRouter)
app.use("/api/schools", schoolRoutes)
app.use("/api/students", studentRoute)
app.use("/api/immunizable-diseases", diseaseRouter)
app.use("/api/staff", staffRouter)
app.use("/api/fees", feesRouter)
app.use("/api/academics", academicsRouter)
app.use("/api/grading_system", gradingSystemRouter)
const server = createServer(app)
server.listen(PORT, () => console.log(`${name} is running - on port ${PORT}`))
