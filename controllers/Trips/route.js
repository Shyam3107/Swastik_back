const { Router } = require("express")
const {
  addTrips,
  getTrips,
  uploadTrips,
  editTrips,
  deleteTrips,
} = require("./controller")
const router = Router()
const uploadFile = require("../../utils/uploadFile")

router.get("/getTrips", getTrips)
router.post("/addTrips", addTrips)
router.put("/editTrips", editTrips)
router.post("/uploadTrips", uploadFile.single("file"), uploadTrips)
router.delete("/deleteTrips", deleteTrips)

module.exports = router
