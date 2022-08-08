import { Router } from "express"
import {
  addReceipt,
  getReceipt,
  deleteReceipt,
  editReceipt,
  downloadReceipt,
} from "./controller.js"
const router = Router()

router.get("/getReceipt", getReceipt)
router.post("/addReceipt", addReceipt)
router.put("/editReceipt", editReceipt)
router.delete("/deleteReceipt", deleteReceipt)
router.get("/downloadReceipt", downloadReceipt)

export default router
