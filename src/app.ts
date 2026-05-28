
import express, { type Application, type Request, type Response } from "express"
import { userRouter } from "./user/user.router"


const app : Application = express()

app.use(express.json())

app.get('/', (req : Request, res : Response) => {
  res.send('Hello World!')
})

app.use("/api/auth",userRouter)



export default app