import { Router } from "express";
import { IssueController } from "./issue.controller";
;import { USER_ROLE } from "../../types/typeIndex";
import auth from "../../middleware/auth";


const router = Router();

router.post("/",auth(USER_ROLE.contributor, USER_ROLE.maintainer),IssueController.createIssue
);

router.get("/",IssueController.getAllIssues)

router.get("/:id",IssueController.getSingleIssue)

router.patch("/:id",auth(USER_ROLE.contributor, USER_ROLE.maintainer) ,IssueController.updateIssue)

router.delete("/:id", auth(USER_ROLE.maintainer) ,IssueController.deleteIssue)


export const IssueRouter = router;