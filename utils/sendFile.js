import exceljs from "exceljs"

export const sendExcelFile = async (
  res,
  columns = [],
  rows = [],
  filename = new Date().getTime()
) => {
  let workbook = new exceljs.Workbook()
  let worksheet = workbook.addWorksheet(filename)
  worksheet.columns = columns

  worksheet.addRows(rows)
  worksheet.autoFilter = {
    from: "A1",
    to: `${String.fromCharCode(64 + columns.length)}1`,
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=" + `${filename}.xlsx`
  )
  await workbook.xlsx.write(res)
  res.status(200).end()
}
