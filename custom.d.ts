export interface CustomRequest extends Request {
    user: {
        churchID: string;
        _id: string;
    };
    files: any;
}