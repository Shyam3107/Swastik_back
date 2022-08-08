import { Router } from "express"
import {
  addExpenses,
  getExpenses,
  uploadExpenses,
  deleteExpenses,
  editExpenses,
  downloadExpenses,
} from "./controller.js"
const router = Router()

router.get("/getExpenses", getExpenses)
router.post("/addExpenses", addExpenses)
router.post("/uploadExpenses", uploadExpenses)
router.put("/editExpenses", editExpenses)
router.delete("/deleteExpenses", deleteExpenses)
router.get("/downloadExpenses", downloadExpenses)

export default router
