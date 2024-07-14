import { Router } from "express"
const router = Router()

import {
  getDrivers
} from "./controller.js"

router.get("/getDrivers", getDrivers)

export default router
