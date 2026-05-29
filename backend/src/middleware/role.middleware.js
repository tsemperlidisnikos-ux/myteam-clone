export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

export const staffOnly = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "coach") {
    return res.status(403).json({ error: "Staff access required" });
  }
  next();
};
