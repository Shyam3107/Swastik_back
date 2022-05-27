// import multer, { diskStorage } from "multer"
// import { join } from "path"

// const filePathNew = join(__dirname, "../public")

// const storage = diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, filePathNew)
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`)
//   },
// })

// const uploadFile = multer({ storage: storage })
// export default uploadFile
