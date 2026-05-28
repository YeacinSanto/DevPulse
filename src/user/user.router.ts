import { Router } from "express";
import { userController } from "./user.controller";



const router = Router()

router.post("/signup",userController.signUpUser)
router.post("/login",userController.loginUser)



export const userRouter = router;