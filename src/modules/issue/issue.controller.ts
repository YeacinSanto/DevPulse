import { response, type Request, type Response } from "express";
import { IssueService } from "./issue.service";
import { pool } from "../../db/indexDB";
import { USER_ROLE } from "../../types/typeIndex";

const createIssue = async (req: Request, res: Response) => {
  try {
    const { title, description, type } = req.body;

    const user = (req as any).user; 

    const reporter_id = user.id;

    
    const result = await IssueService.createIssueIntoDB(
      { title, description, type },
      reporter_id
    );

    return res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllIssues = async (req: Request, res: Response) => {
  try {
    const result = await IssueService.getAllIssueFromDB();

    return res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSingleIssue = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await IssueService.getSingleIssueFromDB(id as string);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

const updateIssue = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = req.user;

    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const issueResult = await pool.query(
      `SELECT * FROM issues WHERE id = $1`,
      [id]
    );

    if (issueResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    const issue = issueResult.rows[0];

    
    if (user.role === "contributor") {
     
      if (issue.reporter_id !== user.id) {
        return res.status(403).json({
          success: false,
          message: "You can update only your own issue",
        });
      }

      if (issue.status !== "open") {
        return res.status(403).json({
          success: false,
          message: "Cannot update closed issue",
        });
      }
    }

    const result = await IssueService.updateIssueIntoDB(req.body, id as string);

    return res.status(200).json({
      success: true,
      message: "Issue updated successfully!",
      data: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteIssue = async(req:Request,res:Response)=>{
  const {id} = req.params;

  try {
    const result = await IssueService.deleteIssueFromDB(id as string);

    if(result.rows.length===0){
      return res.status(404).json({
        success : false,
        message : "Issue not found"
      })
    }

    return res.status(200).json({
      success : true,
      message : "Issue deleted successfully",
    })

  } catch (error : any) {
    return res.status(500).json({
      success : false,
      message : error.message
    })
  }
}

export const IssueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};