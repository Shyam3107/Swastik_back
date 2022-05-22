import { Router } from "express"
import {
  addReceipt,
  getReceipt,
  deleteReceipt,
  editReceipt,
} from "./controller.js"
const router = Router()

router.get("/getReceipt", getReceipt)
router.post("/addReceipt", addReceipt)
router.put("/editReceipt", editReceipt)
router.delete("/deleteReceipt", deleteReceipt)

export default router
