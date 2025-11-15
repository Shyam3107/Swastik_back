import { Router } from "express";
import {
  addFleet,
  getFleet,
  uploadFleet,
  deleteFleet,
  editFleet,
  downloadFleet,
  getFleetListForTrips,
  completeVehicleNumber,
} from "./controller.js";
const router = Router();

router.get("/getFleet", getFleet);
router.post("/addFleet", addFleet);
router.post("/uploadFleet", uploadFleet);
router.put("/editFleet", editFleet);
router.delete("/deleteFleet", deleteFleet);
router.get("/downloadFleet", downloadFleet);
router.get("/getFleetListForTrips", getFleetListForTrips);
router.delete("/completeVehicleNum", completeVehicleNumber);

export default router;
