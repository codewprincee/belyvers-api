import { CustomRequest } from "../../../middlewares/auth.middleware";
import ApiResponse from "../../../utils/ApiResponse";
import asyncHandler from "../../../utils/asyncHandler";
import NewConvert from "../../../models/gospel/NewConvert.model";
import NewConvertModel from "../../../models/gospel/NewConvert.model";
import InviteToChurch from "../../../models/gospel/InviteToChurch.model";
import DataEntry from "../../../models/gospel/DataEntry.model";
// @ts-ignore
const addNewConvertToChurch = asyncHandler(async (req: CustomRequest, res: Response) => {
    const { firstName, lastName, email, phone, zone,inviteToChurch,doSalvationPrayer } = req.body;

    console.log("My data",firstName, lastName, email, phone, zone,inviteToChurch,doSalvationPrayer);
    // Check for empty fields and trim
    if (!firstName || !lastName || !email || !phone || !zone) {
        return ApiResponse.error(res, "All fields are required", 400);
    }

    const { churchID } = req.user;
    const convertToChurch = await NewConvertModel.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        zone: zone.trim(),
        church: churchID,
        inviteToChurch: inviteToChurch,
        doSalvationPrayer
    });
    return ApiResponse.success(res, convertToChurch, "Convert to church created successfully", 201);
})

// @ts-ignore
const inviationToChurch = asyncHandler(async (req: CustomRequest, res: Response) => {
    const { name, email, phone, recipientMail, subject, churchName, churchAddress, churchServiceTime, body } = req.body;

    // Check for empty fields and trim
    if (!name || !email || !phone || !recipientMail || !subject || !churchName || !churchAddress || !churchServiceTime || !body) {
        return ApiResponse.error(res, "All fields are required", 400);
    }

    const { churchID } = req.user;
    const inviationToChurch = await InviteToChurch.create({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        recipientMail: recipientMail.trim(),
        subject: subject.trim(),
        churchName: churchName.trim(),
        churchAddress: churchAddress.trim(),
        churchServiceTime: churchServiceTime.trim(),
        body: body.trim(),
        churchID: churchID
    });
    return ApiResponse.success(res, inviationToChurch, "Invitation to church created successfully", 201);
})

// @ts-ignore
const dataEntry = asyncHandler(async (req: CustomRequest, res: Response) => {
    const { date, time, zone, place, peopleEvangelized, newConvertsMale, newConvertsFemale, PeopleInvite } = req.body;

    
    // Check for empty fields and trim
    if (!date || !time || !zone || !place || !peopleEvangelized || !newConvertsMale || !newConvertsFemale || !PeopleInvite) {
        return ApiResponse.error(res, "All fields are required", 400);
    }

    const { churchID } = req.user;
    const dataEntry = await DataEntry.create({
        date,
        time,
        zone: zone.trim(),
        place: place.trim(),
        peopleEvangelized,
        newConvertsMale,
        newConvertsFemale,
        PeopleInvite,
        church: churchID
    });
    return ApiResponse.success(res, dataEntry, "Data entry created successfully", 201);
})

// @ts-ignore
const getGospelDataEntry = asyncHandler(async (req: CustomRequest, res: Response) => {
    const { churchID } = req.user;

    const gospelDataEntry = await NewConvertModel.find({ church: churchID });
    console.log("Gospel data entry", gospelDataEntry);
    return ApiResponse.success(res, gospelDataEntry, "Gospel data entry fetched successfully", 200);
})


export { addNewConvertToChurch, inviationToChurch, dataEntry, getGospelDataEntry }