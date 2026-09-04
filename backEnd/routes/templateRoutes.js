import express from 'express';
import crypto from 'node:crypto';

import { protect } from '../middlewares/authMiddleware.js';
import {
  requireTenant,
  requireTenantRole,
} from '../middlewares/tenantMiddleware.js';
import Template from '../models/Template.js';
import Tenant from '../models/Tenant.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateTemplateWithAI } from '../services/templateGenerationService.js';
import { recordTenantAudit } from '../services/tenantAuditService.js';

const router = express.Router();
const GENERATION_LIMIT = 3;
const GENERATION_SESSION_COOKIE = 'tenantcart_template_generation_session';
const TEMPLATE_CATEGORIES = new Set([
  'minimal',
  'bold',
  'elegant',
  'playful',
  'corporate',
  'custom',
]);
const generationSessions = new Map();

const getGenerationSession = (req, res) => {
  let sessionId = req.cookies?.[GENERATION_SESSION_COOKIE];

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    res.cookie(GENERATION_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/v1/templates',
    });
  }

  const userId = String(req.user._id);
  const existingSession = generationSessions.get(sessionId);
  const session = existingSession?.userId === userId
    ? existingSession
    : { userId, count: 0 };

  generationSessions.set(sessionId, session);
  return session;
};

const getGenerationUsage = (session) => ({
  limit: GENERATION_LIMIT,
  used: session.count,
  remaining: Math.max(GENERATION_LIMIT - session.count, 0),
});

// List prebuilt templates and the authenticated merchant's AI templates.
router.get(
  '/',
  protect,
  requireTenant,
  requireTenantRole('owner', 'admin', 'manager', 'staff'),
  asyncHandler(async (req, res) => {
    const tenant = await Tenant.findById(req.tenantId)
      .select("branding.template branding.templateId")
      .lean();

    const templates = await Template.find({
      $or: [
        { isAIGenerated: false },
        {
          isAIGenerated: true,
          tenant: req.tenantId,
        },
      ],
    })
      .select('-__v')
      .sort({ category: 1, name: 1 });

    const activeTemplateId = String(tenant?.branding?.template || "");
    const activeTemplateName = tenant?.branding?.templateId || "";

    res.json(templates.map((template) => ({
      ...template.toObject(),
      isApplied:
        String(template._id) === activeTemplateId ||
        template.name === activeTemplateName,
    })));
  })
);

router.get(
  '/generation-limit',
  protect,
  requireTenant,
  requireTenantRole('owner', 'admin', 'manager'),
  (req, res) => {
    const session = getGenerationSession(req, res);
    res.json(getGenerationUsage(session));
  }
);

// Get single template details (public)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const template = await Template.findOne({
      _id: req.params.id,
      isAIGenerated: false,
    });

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
      });
    }

    res.json(template);
  })
);

// Apply template to merchant's store (authenticated merchant only)
router.post(
  '/apply/:templateId',
  protect,
  requireTenant,
  requireTenantRole('owner', 'admin', 'manager'),
  asyncHandler(async (req, res) => {
    const tenant = await Tenant.findById(req.tenantId);

    if (!tenant) {
      return res.status(404).json({
        error: 'No store found. Please create a store first.',
      });
    }

    const template = await Template.findOne({
      _id: req.params.templateId,
      $or: [
        { isAIGenerated: false },
        {
          isAIGenerated: true,
          tenant: req.tenantId,
        },
      ],
    });

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
      });
    }

    // Applying a template replaces the prior template configuration.
    tenant.branding.template = template._id;
    tenant.branding.templateId = template.name;
    tenant.branding.customConfig = template.config.toObject();

    // Also apply colors to branding for backward compatibility
    if (template.config.colors) {
      tenant.branding.primaryColor = template.config.colors.primary;
    }

    await tenant.save();

    await recordTenantAudit({
      tenantId: req.tenantId,
      actorId: req.user._id,
      action: 'template.applied',
      targetType: 'template',
      targetId: template._id,
      metadata: { name: template.name },
      request: req,
    });

    res.json({
      message: 'Template applied successfully',
      templateId: template._id,
      tenant: {
        _id: tenant._id,
        storeName: tenant.storeName,
        slug: tenant.slug,
        branding: tenant.branding,
      },
    });
  })
);

// Generate template with AI
router.post(
  '/generate',
  protect,
  requireTenant,
  requireTenantRole('owner', 'admin', 'manager'),
  asyncHandler(async (req, res) => {
    const { description, category } = req.body;

    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        error: 'Please provide a description of at least 10 characters',
      });
    }

    const templateCategory = TEMPLATE_CATEGORIES.has(category)
      ? category
      : 'custom';

    const session = getGenerationSession(req, res);

    if (session.count >= GENERATION_LIMIT) {
      return res.status(429).json({
        error: `You can generate up to ${GENERATION_LIMIT} templates per session.`,
        generation: getGenerationUsage(session),
      });
    }

    const generatedConfig = await generateTemplateWithAI(
      description,
      templateCategory
    );

    // Save the generated template for reuse
    const template = await Template.create({
      name: `ai-${Date.now()}`,
      displayName: 'AI Generated Template',
      description,
      category: templateCategory,
      isAIGenerated: true,
      config: generatedConfig,
      createdBy: req.user._id,
      tenant: req.tenantId,
    });

    session.count += 1;

    await recordTenantAudit({
      tenantId: req.tenantId,
      actorId: req.user._id,
      action: 'template.generated',
      targetType: 'template',
      targetId: template._id,
      metadata: { category: template.category },
      request: req,
    });

    res.json({
      message: 'Template generated successfully',
      template,
      generation: getGenerationUsage(session),
    });
  })
);

export default router;
