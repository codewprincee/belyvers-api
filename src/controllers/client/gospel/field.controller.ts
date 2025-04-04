import { Request, Response } from "express";
import CityZoneModel from "../../../models/CityZone.model";
import mongoose from "mongoose";
import ApiResponse from "../../../utils/ApiResponse";
import ZoneModel from "../../../models/Zone.model";
import { CustomRequest } from "../../../middlewares/auth.middleware";

const addCitytoZone = async (req: CustomRequest, res: Response) => {
    const { country, province, city, zone } = req.body as { country: string; province: string; city: string; zone: string }; // Type assertion to fix the type error
    const churchID = req.user.churchID;
    const cityZone = await CityZoneModel.create({ country, province, city, zone, church:churchID });
    return ApiResponse.success(res, cityZone, "City added to zone successfully", 201);
}

const viewZone = async (req: CustomRequest, res: Response) => {
    const { zone: zoneId } = req.params;
    const zone = await ZoneModel.findById(zoneId);
    return ApiResponse.success(res, zone, "Zone fetched successfully", 200);
}

const viewCityZone = async (req: CustomRequest, res: Response) => {

    const churchID = req.user.churchID;
    const cityZone = await CityZoneModel.find({ church:churchID });
    console.log('City Zone', cityZone);
    
    return ApiResponse.success(res, cityZone, "City zone fetched successfully", 200);
}

export { addCitytoZone, viewZone, viewCityZone }