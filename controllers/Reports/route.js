import { Router } from "express"
import { getVehiclesReport } from "./controller.js"
const router = Router()

router.get("/getVehiclesReport", getVehiclesReport)

export default router
