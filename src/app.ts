
import express, { type Application, type Request, type Response } from "express"
import { IssueRouter } from "./modules/issue/issue.router"
import { userRouter } from "./modules/user/user.router"
import cors from "cors"

const app : Application = express()

app.use(express.json())

const corseOptions = {
  origin : "https://https://dev-pulse-hazel.vercel.app/"
}  

app.use(cors(corseOptions))

app.get('/', (req : Request, res : Response) => {
  res.status(200).json({
    success : true,
    message : "Welcome to DevPulse",
    endpoints : {
      issue : "/api/issues"
    }
  })
})

app.use("/api/auth",userRouter)
app.use("/api/issues", IssueRouter)




export default app