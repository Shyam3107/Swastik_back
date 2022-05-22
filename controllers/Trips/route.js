import { Router } from "express"
const router = Router()

import {
  addTrips,
  getTrips,
  uploadTrips,
  editTrips,
  deleteTrips,
} from "./controller.js"

router.get("/getTrips", getTrips)
router.post("/addTrips", addTrips)
router.put("/editTrips", editTrips)
router.post("/uploadTrips", uploadTrips)
router.delete("/deleteTrips", deleteTrips)

export default router
