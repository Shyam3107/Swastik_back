import { Router } from "express";
import {
  addReceipt,
  getReceipt,
  deleteReceipt,
  editReceipt,
  downloadReceipt,
  uploadReceipt,
} from "./controller.js";
import {
  checkForPastDataAdditon,
  checkForPastDataDeletions,
  checkForPastDataModifications,
} from "../../middlewares/checkUser.js";
const router = Router();

router.get("/getReceipt", getReceipt);
router.post("/addReceipt", checkForPastDataAdditon(), addReceipt);
router.put(
  "/editReceipt",
  checkForPastDataModifications("RECEIPT"),
  editReceipt
);
router.post("/uploadReceipt", uploadReceipt);
router.delete(
  "/deleteReceipt",
  checkForPastDataDeletions("RECEIPT"),
  deleteReceipt
);
router.get("/downloadReceipt", downloadReceipt);

export default router;
