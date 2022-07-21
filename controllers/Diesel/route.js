import { Router } from "express"
import {
  addDiesels,
  getDiesels,
  uploadDiesels,
  deleteDiesels,
  editDiesels,
} from "./controller.js"
const router = Router()

router.get("/getDiesels", getDiesels)
router.post("/addDiesels", addDiesels)
router.post("/uploadDiesels", uploadDiesels)
router.put("/editDiesels", editDiesels)
router.delete("/deleteDiesels", deleteDiesels)

export default router
