import { Router } from "express"
const router = Router()

import {
  addTrips,
  getTrips,
  uploadTrips,
  editTrips,
  deleteTrips,
  downloadTrips,
} from "./controller.js"

router.get("/getTrips", getTrips)
router.post("/addTrips", addTrips)
router.put("/editTrips", editTrips)
router.post("/uploadTrips", uploadTrips)
router.delete("/deleteTrips", deleteTrips)
router.get("/downloadTrips", downloadTrips)

export default router
