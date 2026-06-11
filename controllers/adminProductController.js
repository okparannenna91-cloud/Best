const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const slugify = require('slugify');

exports.getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, search, isActive } = req.query;
    const query = {};
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.name = { $regex: search, $options: 'i' };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    ApiResponse.paginated(res, products, Number(page), Number(limit), total);
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return next(ApiError.notFound('Product not found'));
    ApiResponse.success(res, product);
  } catch (error) {
    next(error);
  }
};

const ALLOWED_FIELDS = [
  'name', 'description', 'category', 'price', 'comparePrice', 'stock', 'sku',
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
      images: images || [],
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
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) return next(ApiError.notFound('Product not found'));
    ApiResponse.success(res, product, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return next(ApiError.notFound('Product not found'));
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
