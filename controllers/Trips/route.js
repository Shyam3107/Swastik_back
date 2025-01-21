import { Router } from "express";
const router = Router();

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
  tempController,
} from "./controller.js";
import {
  checkForPastDataAdditon,
  checkForPastDataModifications,
} from "../../middlewares/checkUser.js";

router.get("/getTrips", getTrips);
router.get("/getTripsByVehicle", getTripsByVehicle);
router.post("/addTrips", checkForPastDataAdditon(), addTrips);
router.put("/editTrips", checkForPastDataModifications("TRIP"), editTrips);
router.post("/uploadTrips", uploadTrips);
router.delete("/uploadRates", uploadRates);
router.delete("/deleteTrips", deleteTrips);
router.get("/downloadTrips", downloadTrips);
router.get("/downloadTripsByVehicle", downloadTripsByVehicle);
router.get("/tempController", tempController);

export default router;
