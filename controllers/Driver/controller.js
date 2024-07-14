import {
    handleError
} from "../../utils/utils.js"
import Driver from "../../models/Driver.js"

// Get the list of Drivers
export const getDrivers = async (req, res) => {
    try {
        const user = req.user

        let query = {
            companyAdminId: user.companyAdminId
        }

        let select = { __v: 0, createdAt: 0, updatedAt: 0, companyAdminId: 0, lastUpdatedBy: 0 }

        const driverList = await Driver.find(query)
            .select(select)
            .sort({ driverName: 1 })

        return res.status(200).json({ data: driverList })
    } catch (error) {
        return handleError(res, error)
    }
}
