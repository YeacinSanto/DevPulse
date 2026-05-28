import type { Request, Response } from "express"
import { UserService } from "./user.service"


const signUpUser = async(req : Request,res :Response)=>{
    // console.log(req.body)
    try {
        const result = await UserService.signUpUserIntoDB(req.body)
        res.status(201).json({
            success : true,
            message : "User Registered Successfully",
            data : result.rows[0]
        })
        
    } catch (error:any) {
        res.status(500).json({
            success : false,
            message : error.message
        })
    }
}

const loginUser = async (req: Request, res: Response) => {
  try {
    const result = await UserService.logInUserIntoDB(req.body);

    const { accessToken, refreshToken, user} = result;


    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, 
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: accessToken,
        user
      },
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export const userController = {
    signUpUser,
    loginUser
}