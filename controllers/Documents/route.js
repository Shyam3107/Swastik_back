import { Router } from "express"
import {
  addDocuments,
  getDocuments,
  uploadDocuments,
  deleteDocuments,
  editDocuments,
} from "./controller.js"
const router = Router()

router.get("/getDocuments", getDocuments)
router.post("/addDocuments", addDocuments)
router.post("/uploadDocuments", uploadDocuments)
router.put("/editDocuments", editDocuments)
router.delete("/deleteDocuments", deleteDocuments)

export default router
