export const handleDuplication = (res, error) => {
  let errMssg = error?.message
  errMssg = errMssg.split("dup key:")[1]
  if (errMssg) error = "Duplicate Found : " + errMssg
  return res.status(400).json({
    error: error ?? "Failed to Insert Documents, Please Try Again",
  })
}
