import { Router } from "express";
import {
  addDriverHistory,
  getDriverHistory,
  deleteDriverHistory,
  editDriverHistory,
  downloadDriverHistory,
} from "./controller.js";
const router = Router();

router.get("/getDriverHistory", getDriverHistory);
router.post("/addDriverHistory", addDriverHistory);
router.put("/editDriverHistory", editDriverHistory);
router.delete("/deleteDriverHistory", deleteDriverHistory);
router.get("/downloadDriverHistory", downloadDriverHistory);

export default router;
