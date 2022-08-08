import { Router } from "express"
import {
  addLogistics,
  getLogistics,
  uploadLogistics,
  deleteLogistics,
  editLogistics,
  downloadLogistics,
} from "./controller.js"
const router = Router()

router.get("/getLogistics", getLogistics)
router.post("/addLogistics", addLogistics)
router.post("/uploadLogistics", uploadLogistics)
router.put("/editLogistics", editLogistics)
router.delete("/deleteLogistics", deleteLogistics)
router.get("/downloadLogistics", downloadLogistics)

export default router
