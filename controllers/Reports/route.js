import { Router } from "express"
import {
  getVehiclesReport,
  getDieselsReport,
  getHardwareShopReport,
} from "./controller.js"
const router = Router()

router.get("/getVehiclesReport", getVehiclesReport)
router.get("/getDieselsReport", getDieselsReport)
router.get("/getHardwareShopReport", getHardwareShopReport)

export default router
