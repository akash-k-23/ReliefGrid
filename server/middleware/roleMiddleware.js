export const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Insufficient permissions" });
  }
  next();
};

export const allowVerifiedNgo = (req, res, next) => {
  if (!req.user || req.user.role !== "NGO" || req.user.verificationStatus !== "VERIFIED") {
    return res.status(403).json({ success: false, message: "A verified NGO account is required" });
  }
  next();
};
