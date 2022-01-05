const { Router } = require("express");
const {
  addReceipt,
  getReceipt,
  deleteReceipt,
  editReceipt,
} = require("./controller");
const router = Router();

router.get("/getReceipt", getReceipt);
router.post("/addReceipt", addReceipt);
router.put("/editReceipt", editReceipt);
router.delete("/deleteReceipt", deleteReceipt);

module.exports = router;
