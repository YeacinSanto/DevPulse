
import express, { type Application, type Request, type Response } from "express"
import { IssueRouter } from "./modules/issue/issue.router"
import { userRouter } from "./modules/user/user.router"


const app : Application = express()

app.use(express.json())

app.get('/', (req : Request, res : Response) => {
  res.send('Hello World!')
})

app.use("/api/auth",userRouter)
app.use("/api/issues", IssueRouter)



export default app