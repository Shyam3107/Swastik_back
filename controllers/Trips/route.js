import { Router } from "express"
const router = Router()

import {
  addTrips,
  getTrips,
  uploadTrips,
  uploadRates,
  editTrips,
  deleteTrips,
  downloadTrips,
  getTripsByVehicle,
  downloadTripsByVehicle,
} from "./controller.js"

router.get("/getTrips", getTrips)
router.get("/getTripsByVehicle", getTripsByVehicle)
router.post("/addTrips", addTrips)
router.put("/editTrips", editTrips)
router.post("/uploadTrips", uploadTrips)
router.put("/uploadRates", uploadRates)
router.delete("/deleteTrips", deleteTrips)
router.get("/downloadTrips", downloadTrips)
router.get("/downloadTripsByVehicle", downloadTripsByVehicle)

export default router
