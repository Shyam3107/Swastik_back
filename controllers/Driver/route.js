import { Router } from "express";
const router = Router();

import {
  getDrivers,
  addDriver,
  uploadDrivers,
  editDriver,
  deleteDriver,
  downloadDriver,
} from "./controller.js";

router.get("/getDrivers", getDrivers);
router.post("/addDriver", addDriver);
router.post("/uploadDrivers", uploadDrivers);
router.put("/editDriver", editDriver);
router.delete("/deleteDriver", deleteDriver);
router.get("/downloadDriver", downloadDriver);

export default router;
