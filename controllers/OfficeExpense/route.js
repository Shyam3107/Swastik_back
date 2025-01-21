import { Router } from "express";
import {
  addExpenses,
  getExpenses,
  uploadExpenses,
  deleteExpenses,
  editExpenses,
  downloadExpenses,
} from "./controller.js";
import { checkForPastDataModifications } from "../../middlewares/checkUser.js";
const router = Router();

router.get("/getExpenses", getExpenses);
router.post("/addExpenses", checkForPastDataModifications(), addExpenses);
router.post("/uploadExpenses", uploadExpenses);
router.put(
  "/editExpenses",
  checkForPastDataModifications("OFFICE EXPENSE"),
  editExpenses
);
router.delete("/deleteExpenses", deleteExpenses);
router.get("/downloadExpenses", downloadExpenses);

export default router;
