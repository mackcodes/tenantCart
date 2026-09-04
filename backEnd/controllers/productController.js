import slugify from "slugify";
import Product from "../models/Product.js";
import { recordTenantAudit } from "../services/tenantAuditService.js";

const createUniqueSlug = async (
  name,
  tenantId,
  currentProductId = null
) => {
  const baseSlug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });

  let slug = baseSlug || "product";
  let counter = 1;

  while (true) {
    const query = {
      tenantId,
      slug,
    };

    if (currentProductId) {
      query._id = {
        $ne: currentProductId,
      };
    }

    const existingProduct =
      await Product.findOne(query);

    if (!existingProduct) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};

const getTenantId = (req) => {
  return req.tenantId;
};

export const uploadProductImage = async (
  req,
  res,
  next
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Choose an image file to upload",
      });
    }

    const imageUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/products/${req.tenantId}/${req.file.filename}`;

    return res.status(201).json({
      message: "Image uploaded successfully",
      imageUrl,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({
        message:
          "Create a store before adding products",
      });
    }

    const {
      name,
      description,
      price,
      compareAtPrice,
      stock,
      category,
      images,
      isActive,
    } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        message:
          "Name and description are required",
      });
    }

    if (
      price === undefined ||
      Number.isNaN(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        message: "A valid price is required",
      });
    }

    if (
      stock === undefined ||
      Number.isNaN(Number(stock)) ||
      Number(stock) < 0
    ) {
      return res.status(400).json({
        message: "A valid stock quantity is required",
      });
    }

    const slug = await createUniqueSlug(
      name,
      tenantId
    );

    const product = await Product.create({
      tenantId,
      name,
      slug,
      description,
      price: Number(price),
      compareAtPrice:
        compareAtPrice === "" ||
        compareAtPrice === undefined
          ? null
          : Number(compareAtPrice),
      stock: Number(stock),
      category: category || "General",
      images: Array.isArray(images)
        ? images
        : [],
      isActive:
        isActive === undefined
          ? true
          : Boolean(isActive),
    });

    await recordTenantAudit({
      tenantId,
      actorId: req.user._id,
      action: "product.created",
      targetType: "product",
      targetId: product._id,
      metadata: { name: product.name },
      request: req,
    });

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const getMerchantProducts = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({
        message: "Store not found",
      });
    }

    const products = await Product.find({
      tenantId,
    }).sort({
      createdAt: -1,
    });

    return res.json({
      products,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = getTenantId(req);

    const product = await Product.findOne({
      _id: req.params.id,
      tenantId,
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.json({
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = getTenantId(req);

    const product = await Product.findOne({
      _id: req.params.id,
      tenantId,
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const {
      name,
      description,
      price,
      compareAtPrice,
      stock,
      category,
      images,
      isActive,
    } = req.body;

    if (name !== undefined) {
      product.name = name;
      product.slug = await createUniqueSlug(
        name,
        tenantId,
        product._id
      );
    }

    if (description !== undefined) {
      product.description = description;
    }

    if (price !== undefined) {
      if (
        Number.isNaN(Number(price)) ||
        Number(price) < 0
      ) {
        return res.status(400).json({
          message: "Invalid price",
        });
      }

      product.price = Number(price);
    }

    if (compareAtPrice !== undefined) {
      product.compareAtPrice =
        compareAtPrice === "" ||
        compareAtPrice === null
          ? null
          : Number(compareAtPrice);
    }

    if (stock !== undefined) {
      if (
        Number.isNaN(Number(stock)) ||
        Number(stock) < 0
      ) {
        return res.status(400).json({
          message: "Invalid stock quantity",
        });
      }

      product.stock = Number(stock);
    }

    if (category !== undefined) {
      product.category = category;
    }

    if (images !== undefined) {
      product.images = Array.isArray(images)
        ? images
        : [];
    }

    if (isActive !== undefined) {
      product.isActive = Boolean(isActive);
    }

    await product.save();

    await recordTenantAudit({
      tenantId,
      actorId: req.user._id,
      action: "product.updated",
      targetType: "product",
      targetId: product._id,
      metadata: { name: product.name },
      request: req,
    });

    return res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = getTenantId(req);

    const product =
      await Product.findOneAndDelete({
        _id: req.params.id,
        tenantId,
      });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    await recordTenantAudit({
      tenantId,
      actorId: req.user._id,
      action: "product.deleted",
      targetType: "product",
      targetId: product._id,
      metadata: { name: product.name },
      request: req,
    });

    return res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
