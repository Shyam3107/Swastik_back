import { Router } from "express"
import { getVehiclesReport, getDieselsReport } from "./controller.js"
const router = Router()

router.get("/getVehiclesReport", getVehiclesReport)
router.get("/getDieselsReport", getDieselsReport)

export default router
