import { Router } from "express";
import {
  addExpenses,
  getExpenses,
  uploadExpenses,
  deleteExpenses,
  editExpenses,
  downloadExpenses,
} from "./controller.js";
import {
  checkForPastDataAdditon,
  checkForPastDataDeletions,
  checkForPastDataModifications,
} from "../../middlewares/checkUser.js";
const router = Router();

router.get("/getExpenses", getExpenses);
router.post("/addExpenses", checkForPastDataAdditon(), addExpenses);
router.post("/uploadExpenses", uploadExpenses);
router.put(
  "/editExpenses",
  checkForPastDataModifications("OFFICE EXPENSE"),
  editExpenses
);
router.delete(
  "/deleteExpenses",
  checkForPastDataDeletions("DELETE EXPENSE"),
  deleteExpenses
);
router.get("/downloadExpenses", downloadExpenses);

export default router;
