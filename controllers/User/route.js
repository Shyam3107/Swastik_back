import { Router } from "express"
import { login, forgotPassword } from "./controller.js"
const router = Router()

router.get("/login", login)
router.get("/forgotPassword", forgotPassword)

export default router
