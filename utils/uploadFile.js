const multer = require("multer");
const path = require("path");

const filePathNew = path.join(__dirname, "../public/uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, filePathNew);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploadFile = multer({ storage: storage });
module.exports = uploadFile;
