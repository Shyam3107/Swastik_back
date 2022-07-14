import { Router } from "express"
import {
  addVoucher,
  getVoucher,
  deleteVoucher,
  editVoucher,
  uploadVoucher,
} from "./controller.js"
const router = Router()

router.get("/getVouchers", getVoucher)
router.post("/addVouchers", addVoucher)
router.put("/editVouchers", editVoucher)
router.post("/uploadVouchers", uploadVoucher)
router.delete("/deleteVouchers", deleteVoucher)

export default router
