const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const slugify = require('slugify');
const cloudinary = require('../config/cloudinary');

const FOLDER = 'sollene/products';

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  return images.map(img => {
    if (typeof img === 'string') return img ? { url: img, publicId: '' } : null;
    if (!img || !img.url) return null;
    return { url: img.url, publicId: img.publicId || '' };
  }).filter(Boolean);
}

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: FOLDER, resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

const MAGIC_BYTES = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

function validateImageBuffer(buffer, mimeType) {
  const sigs = MAGIC_BYTES[mimeType];
  if (!sigs) return false;
  return sigs.some(sig => {
    if (buffer.length < sig.length) return false;
    for (let i = 0; i < sig.length; i++) {
      if (buffer[i] !== sig[i]) return false;
    }
    if (mimeType === 'image/webp') {
      if (buffer.length < 12) return false;
      if (buffer[8] !== 0x57 || buffer[9] !== 0x45 || buffer[10] !== 0x42 || buffer[11] !== 0x50) return false;
    }
    return true;
  });
}

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return next(ApiError.badRequest('No file provided'));
    if (!validateImageBuffer(req.file.buffer, req.file.mimetype)) {
      return next(ApiError.badRequest('Invalid or corrupted image file'));
    }

    const result = await uploadToCloudinary(req.file.buffer);
    ApiResponse.success(res, result, 'Image uploaded');
  } catch (error) {
    next(error);
  }
};

exports.removeImage = async (req, res, next) => {
  try {
    const { publicId } = req.body;
    if (!publicId) return next(ApiError.badRequest('No publicId provided'));

    await cloudinary.uploader.destroy(publicId);
    ApiResponse.success(res, null, 'Image removed');
  } catch (error) {
    next(error);
  }
};

exports.getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, search, isActive } = req.query;
    const query = {};
    if (category && typeof category === 'string') query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search && typeof search === 'string') query.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(Math.max(0, (Number(page) - 1)) * Math.min(Number(limit), 100))
      .limit(Math.min(Number(limit), 100));

    const result = products.map(p => {
      const doc = p.toObject();
      doc.images = normalizeImages(doc.images);
      return doc;
    });

    ApiResponse.paginated(res, result, Number(page), Number(limit), total);
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return next(ApiError.notFound('Product not found'));
    const doc = product.toObject();
    doc.images = normalizeImages(doc.images);
    ApiResponse.success(res, doc);
  } catch (error) {
    next(error);
  }
};

const ALLOWED_FIELDS = [
  'name', 'slug', 'description', 'category', 'price', 'comparePrice', 'stock', 'sku',
  'variants', 'isFeatured', 'isBestSeller', 'isNewArrival', 'tags', 'badge',
  'images', 'specifications', 'seo', 'isActive',
];

exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, category, price, comparePrice, stock, sku, variants, isFeatured, isBestSeller, isNewArrival, tags, badge, images, specifications, seo } = req.body;

    let slug = slugify(name, { lower: true, strict: true });
    const existing = await Product.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const product = await Product.create({
      name, slug, description, category, price, comparePrice, stock, sku,
      variants: variants || [],
      isFeatured: isFeatured || false,
      isBestSeller: isBestSeller || false,
      isNewArrival: isNewArrival || false,
      tags: tags || [],
      badge: badge || '',
      images: normalizeImages(images),
      specifications: specifications || [],
      seo: seo || {},
    });

    ApiResponse.success(res, product, 'Product created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const updates = {};
    for (const key of ALLOWED_FIELDS) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.images) updates.images = normalizeImages(updates.images);

    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) return next(ApiError.notFound('Product not found'));
    ApiResponse.success(res, product, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next(ApiError.notFound('Product not found'));

    const images = normalizeImages(product.images || []);
    await Promise.allSettled(
      images.filter(img => img.publicId).map(img => cloudinary.uploader.destroy(img.publicId))
    );

    await Product.findByIdAndDelete(req.params.id);
    ApiResponse.success(res, null, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.bulkUpdateStock = async (req, res, next) => {
  try {
    const { items } = req.body;
    for (const item of items) {
      await Product.findByIdAndUpdate(item.id, { stock: item.stock });
    }
    ApiResponse.success(res, null, 'Stock updated successfully');
  } catch (error) {
    next(error);
  }
};
