import { Router } from "express";
import bcrypt from "bcryptjs";
import { AppUser } from "../models/AppUser.js";
import { signToken } from "../middleware/auth.js";
import { z } from "zod";
const r = Router();
const reg = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});
r.post("/register", async (req, res) => {
    const body = reg.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: body.error.flatten() });
        return;
    }
    const exists = await AppUser.findOne({ email: body.data.email });
    if (exists) {
        res.status(409).json({ error: "Email in use" });
        return;
    }
    const passwordHash = await bcrypt.hash(body.data.password, 10);
    const u = await AppUser.create({ email: body.data.email, passwordHash });
    res.json({ token: signToken(u._id.toString()), email: u.email });
});
r.post("/login", async (req, res) => {
    const body = reg.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: body.error.flatten() });
        return;
    }
    const u = await AppUser.findOne({ email: body.data.email });
    if (!u || !(await bcrypt.compare(body.data.password, u.passwordHash))) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }
    res.json({ token: signToken(u._id.toString()), email: u.email });
});
export default r;
//# sourceMappingURL=auth.js.map