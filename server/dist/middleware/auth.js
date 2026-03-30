import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export function requireAuth(req, res, next) {
    const h = req.headers.authorization;
    const token = h?.startsWith("Bearer ") ? h.slice(7) : undefined;
    if (!token) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        const p = jwt.verify(token, env.JWT_SECRET);
        req.userId = p.sub;
        next();
    }
    catch {
        res.status(401).json({ error: "Invalid token" });
    }
}
export function signToken(userId) {
    return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: "7d" });
}
//# sourceMappingURL=auth.js.map