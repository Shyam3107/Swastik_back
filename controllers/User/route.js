const { Router } = require("express");
const { login, forgotPassword } = require("./controller");
const router = Router();

router.get("/login", login);
router.get("/forgotPassword", forgotPassword);

module.exports = router;
