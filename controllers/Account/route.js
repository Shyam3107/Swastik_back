import { Router } from "express"
import {
  addAccount,
  getAccount,
  deleteAccount,
  editAccount,
} from "./controller.js"
const router = Router()

router.get("/getAccount", getAccount)
router.post("/addAccount", addAccount)
router.put("/editAccount", editAccount)
router.delete("/deleteAccount", deleteAccount)

export default router
