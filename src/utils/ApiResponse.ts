class ApiResponse {
    static success(res: any, data: any, message: string = 'Success', statusCode: number = 200) {
        res.status(statusCode);
        return res.json({
            success: true,
            message,
            data,
            error: null,
            statusCode
        });
    }

    static error(res: any, message: string = 'Error', statusCode: number = 500, error: any = null) {
        res.status(statusCode);
        return res.json({
            success: false,
            message,
            error,
            data: null,
            statusCode
        });
    }
}

export default ApiResponse;