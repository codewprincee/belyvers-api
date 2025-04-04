import UserModel from "../models/User.model";
declare global {
    namespace Express {
        interface Request {
            user?: UserModel; // Make sure the `user` field is optional or adjust based on your use case
        }
    }
}
