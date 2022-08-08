import { Router } from "express"
import {
  addDiesels,
  getDiesels,
  uploadDiesels,
  deleteDiesels,
  editDiesels,
  downloadDiesels,
} from "./controller.js"
const router = Router()

router.get("/getDiesels", getDiesels)
router.post("/addDiesels", addDiesels)
router.post("/uploadDiesels", uploadDiesels)
router.put("/editDiesels", editDiesels)
router.delete("/deleteDiesels", deleteDiesels)
router.get("/downloadDiesels", downloadDiesels)

export default router
