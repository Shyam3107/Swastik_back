const httpCallLogger = (req, res, next) => {
  console.log(req.method, " ", req.url, " ", res.statusCode)
  next()
}

export default httpCallLogger
