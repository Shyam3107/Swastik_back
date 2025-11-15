import { Router } from "express";
import {
  addDocuments,
  getDocuments,
  uploadDocuments,
  deleteDocuments,
  editDocuments,
  downloadDocuments,
  downloadMissingDocuments,
} from "./controller.js";
const router = Router();

router.get("/getDocuments", getDocuments);
router.post("/addDocuments", addDocuments);
router.post("/uploadDocuments", uploadDocuments);
router.put("/editDocuments", editDocuments);
router.delete("/deleteDocuments", deleteDocuments);
router.get("/downloadDocuments", downloadDocuments);
router.get("/downloadMissingDocuments", downloadMissingDocuments);

export default router;
