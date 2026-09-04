const requireMerchant = (req, res, next) => {
  if (!req.user || req.user.role !== "merchant") {
    return res.status(403).json({
      message: "Merchant access required",
    });
  }

  next();
};

export const requireStoreRegistrant = (
  req,
  res,
  next
) => {
  if (
    !req.user ||
    !["merchant", "user"].includes(req.user.role)
  ) {
    return res.status(403).json({
      message: "Store registration is only available to merchant accounts",
    });
  }

  next();
};

export default requireMerchant;
