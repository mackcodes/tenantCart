import Tenant from "../models/Tenant.js";

export const getMarkets = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.tenantId).select("markets");
    return res.json({ markets: tenant?.markets || {} });
  } catch (error) {
    next(error);
  }
};

export const saveMarkets = async (req, res, next) => {
  try {
    const { currency, language, timezone } = req.body;
    const tenant = await Tenant.findByIdAndUpdate(
      req.tenantId,
      {
        $set: {
          "markets.currency": currency,
          "markets.language": language,
          "markets.timezone": timezone,
        },
      },
      { new: true, runValidators: true }
    ).select("markets");
    return res.json({ message: "Markets settings saved.", markets: tenant.markets });
  } catch (error) {
    next(error);
  }
};
