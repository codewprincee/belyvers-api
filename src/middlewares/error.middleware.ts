import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log the error details
  winston.error('Error message: ', err.message);
  winston.error('Error stack: ', err.stack);

  // Determine the status code
  const statusCode = err.status || 500;

  // Prepare the error response
  const errorResponse = {
    message: statusCode === 500 ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
};