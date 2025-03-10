import { Router } from "express"
import {
  getVehiclesReport,
  getDieselsReport,
  getHardwareShopReport,
  getVehicleDieselReport,
  downloadAllVehicleWiseReport
} from "./controller.js"
import {
  getAllSiteReport,
  getSiteReport,
  downloadSiteReport,
  downloadAllSitesRokar
} from "./siteController.js"
const router = Router()

router.get("/getVehiclesReport", getVehiclesReport)
router.get("/getDieselsReport", getDieselsReport)
router.get("/getHardwareShopReport", getHardwareShopReport)
router.get("/getVehicleDieselReport", getVehicleDieselReport)
router.get("/getAllSiteReport", getAllSiteReport)
router.get("/getSiteReport", getSiteReport)
router.get("/downloadSiteReport", downloadSiteReport)
router.get("/downloadAllVehicleWiseReport", downloadAllVehicleWiseReport)
router.get("/downloadAllSitesRokar", downloadAllSitesRokar)


export default router
