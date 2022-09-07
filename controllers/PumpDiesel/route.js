import { Router } from "express"
import {
  addDiesels,
  getDiesels,
  uploadDiesels,
  deleteDiesels,
  editDiesels,
  downloadDiesels,
  getDieselsByVehicle,
  getDieselsByPump,
  downloadDieselsByVehicle,
  downloadDieselsByPump,
  getUniquePumpNames,
} from "./controller.js"
const router = Router()

router.get("/getDiesels", getDiesels)
router.get("/getDieselsByVehicle", getDieselsByVehicle)
router.get("/getDieselsByPump", getDieselsByPump)
router.get("/getUniquePumpNames", getUniquePumpNames)
router.post("/addDiesels", addDiesels)
router.post("/uploadDiesels", uploadDiesels)
router.put("/editDiesels", editDiesels)
router.delete("/deleteDiesels", deleteDiesels)
router.get("/downloadDiesels", downloadDiesels)
router.get("/downloadDieselsByVehicle", downloadDieselsByVehicle)
router.get("/downloadDieselsByPump", downloadDieselsByPump)

export default router
