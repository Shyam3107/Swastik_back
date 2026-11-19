import moment from "moment";
import momentTimezone from "moment-timezone";
import {
    handleError,
    columnHeaders,
    validateDateWhileUpload,
} from "../../utils/utils.js";
import { INDIA_TZ } from "../../config/constants.js";;
import Trip from "../../models/Trip.js";
import { sendExcelFile } from "../../utils/sendFile.js";

momentTimezone.tz.setDefault(INDIA_TZ);

// Upload the Rate of Trips
export const uploadUTCLBills = async (req, res) => {
    const session = await Trip.startSession();
    try {
        session.startTransaction();

        console.log("Received request to upload UTCL bills:", req.body);

        const dataToBeUpdate = req.body.data ?? [];

        // For Excel, DI whose rate hasn't been updated
        const column1 = [
            columnHeaders("DI No.", "DI No."),
            columnHeaders("Date", "Date"),
            columnHeaders("Vehicle No.", "Vehicle No."),
            columnHeaders("Quantity", "Quantity"),
            columnHeaders("Billing Rate", "Billing Rate"),
            columnHeaders("Rate", "Rate"),
            columnHeaders("E-way Bill No.", "E-way Bill No."),
            columnHeaders("E-way Bill Expiry", "E-way Bill Expiry"),
        ];

        let row = [];

        for (let ind = 0; ind < dataToBeUpdate.length; ind++) {
            const item = dataToBeUpdate[ind];

            const diNo = item.diNo;
            const vehicleNo = item.truckNo?.toUpperCase();
            const rate = item.rate;
            const billingRate = item.rate;
            const quantity = Number(item.quantity);
            const eWayBillNo = item.billNo;
            const eWayBillExpiry = item.billDate

            // For Excel, DI whose rate hasn't been updated
            let tempObj = { ...item, reason: "" };
            if (!diNo || !vehicleNo || !quantity || !rate || !billingRate) {
                throw `All Fields are required for row no. ${ind + 2}`;
            }

            let updateData = { billingRate, rate };

            if (eWayBillNo && eWayBillNo?.length > 0) {
                updateData.eWayBillNo = eWayBillNo;
            }

            if (eWayBillExpiry && validateDateWhileUpload(eWayBillExpiry, ind)) {
                updateData.eWayBillExpiry = eWayBillExpiry;
            }

            const updateRate = await Trip.findOneAndUpdate(
                { diNo, vehicleNo, companyAdminId: req.user.companyAdminId, quantity },
                { $set: updateData },
                { session }
            );

            // If not updated, means DI no. with vehicle doesn't exist
            if (!updateRate) {
                tempObj.reason = "Record doesn't exist";
                row.push({
                    "DI No.": diNo,
                    Date: item.date,
                    "Vehicle No.": vehicleNo,
                    Quantity: quantity,
                    "Billing Rate": billingRate,
                    Rate: rate,
                    "E-way Bill No.": eWayBillNo,
                    "E-way Bill Expiry": eWayBillExpiry,
                });
            }

            if (ind % 25 === 0) {
                console.log(`Processed ${ind + 1} rows`);
            }
        }

        console.log(
            "No. of Success Entry : " + (dataToBeUpdate.length - row.length)
        );
        console.log("No. of Failed Entry : " + row.length);

        await session.commitTransaction();

        return sendExcelFile(res, [column1], [row], ["Entries"]);
    } catch (error) {
        await session.abortTransaction();
        return handleError(res, error);
    } finally {
        session.endSession();
    }
};