import express from 'express';

import { protect } from '../middlewares/authMiddleware.js';
import requireMerchant from '../middlewares/merchantMiddleware.js';
import Template from '../models/Template.js';
import Tenant from '../models/Tenant.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateTemplateWithAI } from '../services/templateGenerationService.js';

const router = express.Router();

// List all available templates (public)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const templates = await Template.find({})
      .select('-__v')
      .sort({ category: 1, name: 1 });

    res.json(templates);
  })
);

// Get single template details (public)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const template = await Template.findById(req.params.id);

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
  requireMerchant,
  asyncHandler(async (req, res) => {
    const tenant = await Tenant.findOne({
      owner: req.user._id,
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'No store found. Please create a store first.',
      });
    }

    const template = await Template.findById(req.params.templateId);

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
      });
    }

    // Merge template config into tenant branding
    tenant.branding.template = template._id;

    tenant.branding.customConfig = {
      ...template.config,
      ...tenant.branding.customConfig,
    };

    // Also apply colors to branding for backward compatibility
    if (template.config.colors) {
      tenant.branding.primaryColor = template.config.colors.primary;
    }

    await tenant.save();

    res.json({
      message: 'Template applied successfully',
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
  requireMerchant,
  asyncHandler(async (req, res) => {
    const { description, category } = req.body;

    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        error: 'Please provide a description of at least 10 characters',
      });
    }

    const generatedConfig = await generateTemplateWithAI(
      description,
      category
    );

    // Save the generated template for reuse
    const template = await Template.create({
      name: `ai-${Date.now()}`,
      displayName: 'AI Generated Template',
      description,
      category: category || 'custom',
      isAIGenerated: true,
      config: generatedConfig,
      createdBy: req.user._id,
    });

    res.json({
      message: 'Template generated successfully',
      template,
    });
  })
);

export default router;