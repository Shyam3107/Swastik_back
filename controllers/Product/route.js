import { Router } from "express"
import {
  addProducts,
  getProducts,
  getProductsName,
  uploadProducts,
  deleteProducts,
  editProducts,
  downloadProducts,
  downloadProductsById,
} from "./controller.js"
const router = Router()

router.get("/getProducts", getProducts)
router.get("/getProductsName", getProductsName)
router.post("/addProducts", addProducts)
router.post("/uploadProducts", uploadProducts)
router.put("/editProducts", editProducts)
router.delete("/deleteProducts", deleteProducts)
router.get("/downloadProducts", downloadProducts)
router.get("/downloadProductsById", downloadProductsById)

export default router
