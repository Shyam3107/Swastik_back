import { Router } from "express"
import {
  addOwner,
  getOwner,
  uploadOwner,
  deleteOwner,
  editOwner,
  downloadOwner,
} from "./controller.js"
const router = Router()

router.get("/getOwner", getOwner)
router.post("/addOwner", addOwner)
router.post("/uploadOwner", uploadOwner)
router.put("/editOwner", editOwner)
router.delete("/deleteOwner", deleteOwner)
router.get("/downloadOwner", downloadOwner)

export default router
