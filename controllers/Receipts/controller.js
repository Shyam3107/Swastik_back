import momentTimezone from "moment-timezone";
import {
  handleError,
  errorValidation,
  validateBody,
  userRankQuery,
  parseResponse,
  formatDateInDDMMYYY,
  columnHeaders,
  validateDateWhileUpload,
  isAdmin,
} from "../../utils/utils.js";
import Receipt from "../../models/Receipt.js";
import { sendExcelFile } from "../../utils/sendFile.js";
import { INDIA_TZ } from "../../config/constants.js";
import moment from "moment/moment.js";
import { getUserLastCheckedOn } from "../../middlewares/checkUser.js";

momentTimezone.tz.setDefault(INDIA_TZ);

const fileHeader = ["Date", "Amount", "Remarks"];

const modelHeader = ["date", "amount", "remarks"];

export const getReceipt = async (req, res) => {
  try {
    const user = req.user;
    let { receiptId, from, to } = req.query;

    const userQuery = userRankQuery(user);
    let receipts;
    if (receiptId) {
      receipts = await Receipt.findOne({
        _id: receiptId,
        companyAdminId: user.companyAdminId,
      });
    } else {
      receipts = await Receipt.find({
        ...userQuery,
        date: { $gte: from, $lte: to },
      })
        .populate({
          path: "addedBy",
          select: "location",
        })
        .sort({ date: -1 });
      receipts = parseResponse(receipts);
      receipts = receipts.map((val) => {
        return {
          ...val,
          date: formatDateInDDMMYYY(val.date),
          addedBy: val?.addedBy?.location,
        };
      });
    }

    if (!receipts) throw "Record Not Found";

    return res.status(200).json({ data: receipts });
  } catch (error) {
    return handleError(res, error);
  }
};

export const uploadReceipt = async (req, res) => {
  const session = await Receipt.startSession();
  try {
    const user = req.user;
    session.startTransaction();

    let dataToBeInsert = req.body.data;

    let data = [];

    let lastEntryCheckedOn = await getUserLastCheckedOn(user);

    for (let ind = 0; ind < dataToBeInsert.length; ind++) {
      const item = dataToBeInsert[ind];
      let tempVal = { addedBy: user._id, companyAdminId: user.companyAdminId };
      let mssg = "";

      for (let index = 0; index < modelHeader.length; index++) {
        let head = modelHeader[index];
        let value = item[fileHeader[index]];

        if (!value)
          mssg = `Enter Valid ${fileHeader[index]} for row no. ${ind + 2}`;

        if (mssg) throw mssg;

        if (head === "date") {
          value = validateDateWhileUpload(value, ind);
          // User can't add data on set beyond specific date
          if (!isAdmin(user)) {
            if (moment(value).isSameOrBefore(lastEntryCheckedOn))
              throw `You Can not make changes in Past entries for row no. ${
                ind + 2
              }`;
          }
        }

        tempVal[head] = value;
      }

      data.push(tempVal);
    }

    const insertData = await Receipt.insertMany(data, { session });
    await session.commitTransaction();

    return res.status(200).json({
      entries: insertData.length,
      message: `Successfully Inserted ${insertData.length} entries`,
    });
  } catch (error) {
    await session.abortTransaction();
    return handleError(res, error);
  } finally {
    session.endSession();
  }
};

export const addReceipt = [
  validateBody(modelHeader),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }
      const user = req.user;

      await Receipt.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      });

      return res.status(200).json({
        message: "Receipt Added Successfully",
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

export const editReceipt = [
  validateBody(modelHeader),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }

      const receiptId = req.body._id;

      const updateData = await Receipt.findByIdAndUpdate(
        { _id: receiptId },
        req.body
      );

      if (!updateData) throw "Record Not Found";

      return res.status(200).json({
        data: updateData,
        message: "Office Receipt Edited Successfully",
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

export const deleteReceipt = async (req, res) => {
  try {
    const errors = errorValidation(req, res);
    if (errors) {
      return null;
    }
    const user = req.user;
    const receiptIds = req.body;

    const deletedData = await Receipt.deleteMany({ _id: receiptIds });

    return res.status(200).json({
      data: deletedData,
      message: `Receipt${
        receiptIds.length > 1 ? "s" : ""
      } Deleted Successfully`,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const downloadReceipt = async (req, res) => {
  try {
    const userQuery = userRankQuery(req.user);
    const { from, to } = req.query;
    let data = await Receipt.find({
      ...userQuery,
      date: { $gte: from, $lte: to },
    })
      .select({ addedBy: 1, amount: 1, date: 1, remarks: 1 })
      .populate({
        path: "addedBy",
        select: "location",
      })
      .sort({ date: 1 });

    data = parseResponse(data);

    data = data.map((val) => {
      return {
        ...val,
        date: formatDateInDDMMYYY(val.date),
        addedBy: val?.addedBy?.location,
      };
    });

    const column1 = [
      columnHeaders("Date", "date"),
      columnHeaders("Amount", "amount"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("Added By", "addedBy"),
    ];
    return sendExcelFile(res, [column1], [data], ["Receipts"]);
  } catch (error) {
    return handleError(res, error);
  }
};
