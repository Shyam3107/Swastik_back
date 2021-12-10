const { Router } = require("express");
const {
  addAccount,
  getAccount,
  deleteAccount,
  editAccount,
} = require("./controller");
const router = Router();

router.get("/getAccount", getAccount);
router.post("/addAccount", addAccount);
router.put("/editAccount", editAccount);
router.delete("/deleteAccount", deleteAccount);

module.exports = router;
