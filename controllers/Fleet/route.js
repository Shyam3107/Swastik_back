import { Router } from "express";
import {
  addFleet,
  getFleet,
  uploadFleet,
  deleteFleet,
  editFleet,
  downloadFleet,
} from "./controller.js";
const router = Router();

router.get("/getFleet", getFleet);
router.post("/addFleet", addFleet);
router.post("/uploadFleet", uploadFleet);
router.put("/editFleet", editFleet);
router.delete("/deleteFleet", deleteFleet);
router.get("/downloadFleet", downloadFleet);

export default router;
