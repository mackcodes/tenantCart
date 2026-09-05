import Tenant from "../models/Tenant.js";
import asyncHandler from "../utils/asyncHandler.js";
import { recordTenantAudit } from "../services/tenantAuditService.js";

const sanitizeBanners = (banners) => {
  if (!Array.isArray(banners)) {
    return [];
  }

  return banners.slice(0, 10).map((banner) => ({
    imageUrl: String(banner.imageUrl || "").trim(),
    title: String(banner.title || "").trim().slice(0, 120),
    subtitle: String(banner.subtitle || "").trim().slice(0, 200),
    link: String(banner.link || "").trim(),
  }));
};

const sanitizeFaqs = (faqs) => {
  if (!Array.isArray(faqs)) {
    return [];
  }

  return faqs
    .filter((faq) => faq.question && faq.answer)
    .slice(0, 30)
    .map((faq) => ({
      question: String(faq.question).trim().slice(0, 200),
      answer: String(faq.answer).trim().slice(0, 2000),
    }));
};

export const getContent = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.tenantId).select("content").lean();

  return res.json({ content: tenant?.content || { banners: [], faqs: [] } });
});

export const updateContent = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.tenantId);

  if (!tenant) {
    return res.status(404).json({ message: "Store not found" });
  }

  tenant.content = {
    banners: sanitizeBanners(req.body.banners),
    faqs: sanitizeFaqs(req.body.faqs),
  };

  await tenant.save();

  await recordTenantAudit({
    tenantId: req.tenantId,
    actorId: req.user._id,
    action: "content.updated",
    targetType: "store_content",
    request: req,
  });

  return res.json({
    message: "Storefront content saved successfully",
    content: tenant.content,
  });
});
