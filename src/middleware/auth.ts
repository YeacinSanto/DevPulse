import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
// import config from "../config/indexConfig";
import type { ROLES } from "../types/typeIndex";
import config from "../config/indexConfig";



const auth = (...roles: ROLES[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access",
        });
      }

      const decoded = jwt.verify(token as string,config.secret as string
      ) as JwtPayload;

      req.user = decoded;

      
      if (
        roles.length > 0 &&
        (!decoded.role || !roles.includes(decoded.role as ROLES))
      ) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: role not allowed",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  };
};

export default auth;