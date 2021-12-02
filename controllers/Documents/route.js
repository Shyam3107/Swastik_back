const { Router } = require("express");
const {
  addDocuments,
  getDocuments,
  uploadDocuments,
  deleteDocuments,
  editDocuments,
} = require("./controller");
const router = Router();
const uploadFile = require("../../utils/uploadFile");

router.get("/getDocuments", getDocuments);
router.post("/addDocuments", addDocuments);
router.post("/uploadDocuments", uploadFile.single("file"), uploadDocuments);
router.put("/editDocuments", editDocuments);
router.delete("/deleteDocuments", deleteDocuments);

module.exports = router;
