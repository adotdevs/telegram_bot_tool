import type { Request, Response, NextFunction } from "express";
export type AuthedRequest = Request & {
    userId?: string;
};
export declare function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void;
export declare function signToken(userId: string): string;
//# sourceMappingURL=auth.d.ts.map