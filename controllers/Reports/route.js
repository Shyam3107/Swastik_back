import { Router } from "express"
import {
  getVehiclesReport,
  getDieselsReport,
  getHardwareShopReport,
  getVehicleDieselReport,
} from "./controller.js"
import {
  getAllSiteReport,
  getSiteReport,
  downloadSiteReport
} from "./siteController.js"
const router = Router()

router.get("/getVehiclesReport", getVehiclesReport)
router.get("/getDieselsReport", getDieselsReport)
router.get("/getHardwareShopReport", getHardwareShopReport)
router.get("/getVehicleDieselReport", getVehicleDieselReport)
router.get("/getAllSiteReport", getAllSiteReport)
router.get("/getSiteReport", getSiteReport)
router.get("/downloadSiteReport", downloadSiteReport)

export default router
