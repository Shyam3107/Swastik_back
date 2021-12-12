const { Router } = require("express");
const {
  addExpenses,
  getExpenses,
  uploadExpenses,
  deleteExpenses,
  editExpenses,
} = require("./controller");
const router = Router();
const uploadFile = require("../../utils/uploadFile");

router.get("/getExpenses", getExpenses);
router.post("/addExpenses", addExpenses);
router.post("/uploadExpenses", uploadExpenses);
router.put("/editExpenses", editExpenses);
router.delete("/deleteExpenses", deleteExpenses);

module.exports = router;
