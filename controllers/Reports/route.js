import { Router } from "express"
import {
  getVehiclesReport,
  getDieselsReport,
  getHardwareShopReport,
  getVehicleDieselReport,
} from "./controller.js"
const router = Router()

router.get("/getVehiclesReport", getVehiclesReport)
router.get("/getDieselsReport", getDieselsReport)
router.get("/getHardwareShopReport", getHardwareShopReport)
router.get("/getVehicleDieselReport", getVehicleDieselReport)

export default router
