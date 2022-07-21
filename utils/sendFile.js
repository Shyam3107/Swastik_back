import exceljs from "exceljs"

export const sendExcelFile = async (
  res,
  columns = [],
  rows = [],
  filename = []
) => {
  let workbook = new exceljs.Workbook()
  filename.forEach((val, index) => {
    let worksheet = workbook.addWorksheet(val)
    worksheet.columns = columns[index]

    worksheet.addRows(rows[index])
    worksheet.autoFilter = {
      from: "A1",
      to: `${String.fromCharCode(64 + columns[index].length)}1`,
    }
  })

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
