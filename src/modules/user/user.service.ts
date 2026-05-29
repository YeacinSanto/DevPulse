
import type { IUser } from "./user.interface";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { pool } from "../../db/indexDB";
import config from "../../config/indexConfig";

const signUpUserIntoDB = async(PayLoad : IUser)=>{
    const {name,email,password,role="contributor"} = PayLoad;

    const hashPassword = await bcrypt.hash(password,10)
    // console.log(hashPassword)

   const result = await pool.query(`
            INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,
            $4) RETURNING *
        `,[name,email,hashPassword,role])
    
    delete result.rows[0].password;

    return result

}

const logInUserIntoDB = async(PayLoad : {email:string,password:string})=>{
    const {email,password} = PayLoad;

    // if the user exist
    const userData = await pool.query(`
            SELECT * FROM users WHERE email=$1
        `,[email])
        // delete userData.rows[0].password
    if(userData.rows.length===0){
        throw new Error("Invalid Credentials")
    }

    const user = userData.rows[0];
    // console.log(user)

    const matchPassword = await bcrypt.compare(password,user.password)
    // console.log(matchPassword)

    if(!matchPassword){
        // console.log(" hoy nai")
        throw new Error("Invalid Credentials")
    }


    const jwtPayLoad = {
        id : user.id,
        name : user.name,
        email : user.email,
        role : user.role
    }

    const accessToken = jwt.sign(jwtPayLoad, config.secret as string, {expiresIn : "1d"})

    const refreshToken = jwt.sign(jwtPayLoad, config.refresh_secret as string, {expiresIn : "90d"})

    delete user.password;

    return {accessToken, refreshToken, user}

}

export const UserService = {
    signUpUserIntoDB,
    logInUserIntoDB
}