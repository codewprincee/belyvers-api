import { Request, Response, NextFunction } from "express";

// Middleware to restrict features based on user's plan
interface User {
  features: Record<string, boolean>;
}

const restrictFeature = (featureName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Assuming `req.user` contains the authenticated user details
    const user = req?.user as User;

    if (!user || !user.features) {
      res.status(401).json({ error: "Unauthorized: User not found or features unavailable." });
      return;
    }

    // Check if the feature is available in the user's plan
    if (!user.features[featureName]) {
      res.status(403).json({ error: `Access Denied: Feature '${featureName}' is not available in your plan.` });
      return;
    }

    // If the feature is allowed, proceed to the next middleware/handler
    next();
  };
};

export default restrictFeature;
