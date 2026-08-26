export const requireTenant = (req, res, next) => {
  if (!req.user?.tenant) {
    return res.status(403).json({
      message: "No store registered for this account",
    });
  }

  req.tenantId = req.user.tenant;

  next();
};
