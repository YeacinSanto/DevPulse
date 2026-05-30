

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/modules/issue/issue.router.ts
import { Router } from "express";

// src/modules/issue/issue.controller.ts
import "express";

// src/db/indexDB.ts
import { Pool } from "pg";

// src/config/indexConfig.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: process.env.PORT,
  connection_string: process.env.CONNECTION_STRING,
  secret: process.env.SECRET,
  refresh_secret: process.env.REFRESH_SECRET
};
var indexConfig_default = config;

// src/db/indexDB.ts
var pool = new Pool({
  connectionString: indexConfig_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(30),
        email VARCHAR(80) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(15) DEFAULT 'contributor',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(20) NOT NULL,
        status VARCHAR(15) DEFAULT 'open',
        reporter_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Database connected successfully!!");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/issue/issue.service.ts
var createIssueIntoDB = async (payload, reporter_id) => {
  const { title, description, type } = payload;
  const result = await pool.query(
    `
      INSERT INTO issues (title, description, type, reporter_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [title, description, type, reporter_id]
  );
  return result.rows[0];
};
var getAllIssueFromDB = async () => {
  const result = await pool.query(`
    SELECT * FROM issues
    ORDER BY created_at DESC
  `);
  const issues = result.rows;
  const formattedIssues = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    // temporary (we will fix reporter properly next)
    reporter: {
      id: issue.reporter_id,
      name: issue.name,
      role: issue.role
    },
    created_at: issue.created_at,
    updated_at: issue.updated_at
  }));
  return formattedIssues;
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );
  const issue = issueResult.rows[0];
  if (!issue) {
    return {
      rows: []
    };
  }
  const userResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id]
  );
  const user = userResult.rows[0];
  const formattedIssue = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: user,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
  return {
    rows: [formattedIssue]
  };
};
var updateIssueIntoDB = async (payLoad, id) => {
  const { title, description, type } = payLoad;
  const result = await pool.query(`
            UPDATE issues
            SET
            title = COALESCE($1,title),
            description = COALESCE($2,description),
            type = COALESCE($3, type),
            updated_at = NOW()
            WHERE id = $4
            
            RETURNING *
        `, [title, description, type, id]);
  return result;
};
var deleteIssueFromDB = async (id) => {
  const result = await pool.query(`
      DELETE FROM issues WHERE id=$1
      RETURNING *    
    `, [id]);
  return result;
};
var IssueService = {
  createIssueIntoDB,
  getAllIssueFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/types/typeIndex.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/modules/issue/issue.controller.ts
var createIssue = async (req, res) => {
  try {
    const { title, description, type } = req.body;
    const user = req.user;
    const reporter_id = user.id;
    const result = await IssueService.createIssueIntoDB(
      { title, description, type },
      reporter_id
    );
    return res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const result = await IssueService.getAllIssueFromDB();
    return res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var getSingleIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await IssueService.getSingleIssueFromDB(id);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    return res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
      data: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var updateIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }
    const issueResult = await pool.query(
      `SELECT * FROM issues WHERE id = $1`,
      [id]
    );
    if (issueResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    const issue = issueResult.rows[0];
    if (user.role === "contributor") {
      if (issue.reporter_id !== user.id) {
        return res.status(403).json({
          success: false,
          message: "You can update only your own issue"
        });
      }
      if (issue.status !== "open") {
        return res.status(403).json({
          success: false,
          message: "Cannot update closed issue"
        });
      }
    }
    const result = await IssueService.updateIssueIntoDB(req.body, id);
    return res.status(200).json({
      success: true,
      message: "Issue updated successfully!",
      data: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var deleteIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await IssueService.deleteIssueFromDB(id);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    return res.status(200).json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var IssueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access"
        });
      }
      const decoded = jwt.verify(
        token,
        indexConfig_default.secret
      );
      req.user = decoded;
      if (roles.length > 0 && (!decoded.role || !roles.includes(decoded.role))) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: role not allowed"
        });
      }
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
  };
};
var auth_default = auth;

// src/modules/issue/issue.router.ts
var router = Router();
router.post(
  "/",
  auth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  IssueController.createIssue
);
router.get("/", IssueController.getAllIssues);
router.get("/:id", IssueController.getSingleIssue);
router.patch("/:id", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), IssueController.updateIssue);
router.delete("/:id", auth_default(USER_ROLE.maintainer), IssueController.deleteIssue);
var IssueRouter = router;

// src/modules/user/user.router.ts
import { Router as Router2 } from "express";

// src/modules/user/user.service.ts
import bcrypt from "bcrypt";
import jwt2 from "jsonwebtoken";
var signUpUserIntoDB = async (PayLoad) => {
  const { name, email, password, role = "contributor" } = PayLoad;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(`
            INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,
            $4) RETURNING *
        `, [name, email, hashPassword, role]);
  delete result.rows[0].password;
  return result;
};
var logInUserIntoDB = async (PayLoad) => {
  const { email, password } = PayLoad;
  const userData = await pool.query(`
            SELECT * FROM users WHERE email=$1
        `, [email]);
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials");
  }
  const jwtPayLoad = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const accessToken = jwt2.sign(jwtPayLoad, indexConfig_default.secret, { expiresIn: "1d" });
  const refreshToken = jwt2.sign(jwtPayLoad, indexConfig_default.refresh_secret, { expiresIn: "90d" });
  delete user.password;
  return { accessToken, refreshToken, user };
};
var UserService = {
  signUpUserIntoDB,
  logInUserIntoDB
};

// src/modules/user/user.controller.ts
var signUpUser = async (req, res) => {
  try {
    const { type } = req.body;
    if (type != USER_ROLE.contributor || type != USER_ROLE.maintainer) {
      return res.status(400).json({
        success: false,
        message: "Invalid Role"
      });
    }
    const result = await UserService.signUpUserIntoDB(req.body);
    res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await UserService.logInUserIntoDB(req.body);
    const { accessToken, refreshToken, user } = result;
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    });
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: accessToken,
        user
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};
var userController = {
  signUpUser,
  loginUser
};

// src/modules/user/user.router.ts
var router2 = Router2();
router2.post("/signup", userController.signUpUser);
router2.post("/login", userController.loginUser);
var userRouter = router2;

// src/app.ts
import cors from "cors";
var app = express();
app.use(express.json());
var corseOptions = {
  origin: "https://https://dev-pulse-hazel.vercel.app/"
};
app.use(cors(corseOptions));
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to DevPulse",
    endpoints: {
      issue: "/api/issues"
    }
  });
});
app.use("/api/auth", userRouter);
app.use("/api/issues", IssueRouter);
var app_default = app;

// src/server.ts
app_default.listen(indexConfig_default.port, () => {
  initDB();
  console.log(`Example app listening on port ${indexConfig_default.port}`);
});
//# sourceMappingURL=server.js.map