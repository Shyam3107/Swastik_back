import { Router } from "express"
import {
  addBills,
  getBills,
  uploadBills,
  deleteBills,
  editBills,
  downloadBills,
  downloadBillsByVehicle,
  getBillsByVehicle,
  getBillsByShop,
  downloadBillsByShop,
  getUniqueShop,
} from "./controller.js"
const router = Router()

router.get("/getBills", getBills)
router.get("/getBillsByVehicle", getBillsByVehicle)
router.get("/getBillsByShop", getBillsByShop)
router.get("/getUniqueShop", getUniqueShop)
router.get("/downloadBillsByVehicle", downloadBillsByVehicle)
router.get("/downloadBillsByShop", downloadBillsByShop)
router.get("/downloadBills", downloadBills)
router.post("/addBills", addBills)
router.post("/uploadBills", uploadBills)
router.put("/editBills", editBills)
router.delete("/deleteBills", deleteBills)

export default router
