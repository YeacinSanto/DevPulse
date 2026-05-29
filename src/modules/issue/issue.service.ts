
import { pool } from "../../db/indexDB";
import type { IIssue } from "./issue.interface";

const createIssueIntoDB = async (
  payload: IIssue,
  reporter_id: number
) => {
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

const getAllIssueFromDB = async () => {
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
      name : issue.name,
      role : issue.role
    },

    created_at: issue.created_at,
    updated_at: issue.updated_at,
  }));

  return formattedIssues;
};

const getSingleIssueFromDB = async (id: string) => {
  const issueResult = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );

  const issue = issueResult.rows[0];

  if (!issue) {
    return {
      rows: [],
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
    updated_at: issue.updated_at,
  };

  return {
    rows: [formattedIssue],
  };
};

const updateIssueIntoDB = async (payLoad : IIssue, id:string)=>{
    const {title,description,type} = payLoad;

    const result = await pool.query(`
            UPDATE issues
            SET
            title = COALESCE($1,title),
            description = COALESCE($2,description),
            type = COALESCE($3, type),
            updated_at = NOW()
            WHERE id = $4
            
            RETURNING *
        `,[title,description,type,id])

        return result
}

const deleteIssueFromDB = async(id:string)=>{
  const result = await pool.query(`
      DELETE FROM issues WHERE id=$1
      RETURNING *    
    `,[id])

    return result
}

export const IssueService = {
  createIssueIntoDB,
  getAllIssueFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};