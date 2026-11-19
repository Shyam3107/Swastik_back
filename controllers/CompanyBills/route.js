import { Router } from "express";
import {
    uploadUTCLBills
} from "./controller.js";
const router = Router();

router.post("/uploadUTCLBills", uploadUTCLBills);

export default router;
