import exceljs from "exceljs"

export const createExcelFile = (columns = [], rows = [], workSheets = []) => {
  let workbook = new exceljs.Workbook()
  workSheets.forEach((val, index) => {
    let worksheet = workbook.addWorksheet(val)
    worksheet.columns = columns[index]

    worksheet.addRows(rows[index])
    worksheet.autoFilter = {
      from: "A1",
      to: `${String.fromCharCode(64 + columns[index].length)}1`,
    }
  })
  console.log("Work Book created for ", workSheets)
  return workbook
}

export const sendExcelFile = async (
  res,
  columns = [], // values will be Array of objects
  rows = [], // Array of objects
  workSheets = [] // Size determines the number of worksheet
) => {
  let workbook = createExcelFile(columns, rows, workSheets)

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=" + `${new Date().getTime()}.xlsx`
  )
  await workbook.xlsx.write(res)
  return res.status(200).end()
}
