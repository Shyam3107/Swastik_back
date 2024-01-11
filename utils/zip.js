import AdmZip from "adm-zip"

// File is array of object {file,filename}
export const createZipFile = async (files = []) => {
    let zip = new AdmZip()

    console.log("Number of Files to added : ", files.length)

    files.forEach(file => {
        zip.addFile(file.fileName, file.file)
    })

    // get everything as a buffer
    return zip.toBuffer()
}