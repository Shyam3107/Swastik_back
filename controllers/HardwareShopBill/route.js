import { Router } from "express"
import {
  addBills,
  getBills,
  uploadBills,
  deleteBills,
  editBills,
  downloadBills,
} from "./controller.js"
const router = Router()

router.get("/getBills", getBills)
router.post("/addBills", addBills)
router.post("/uploadBills", uploadBills)
router.put("/editBills", editBills)
router.delete("/deleteBills", deleteBills)
router.get("/downloadBills", downloadBills)

export default router
