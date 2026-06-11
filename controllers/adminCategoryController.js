const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const slugify = require('slugify');

exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 });
    ApiResponse.success(res, categories, 'Categories fetched successfully');
  } catch (error) {
    next(error);
  }
};

exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return next(ApiError.notFound('Category not found'));
    ApiResponse.success(res, category);
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, image, isActive, order } = req.body;
    let slug = slugify(name || req.body.slug, { lower: true, strict: true });
    const existing = await Category.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const category = await Category.create({ name, slug, description, image, isActive, order });
    ApiResponse.success(res, category, 'Category created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { name, slug, description, image, isActive, order } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return next(ApiError.notFound('Category not found'));

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;
    if (order !== undefined) category.order = order;
    if (slug && slug !== category.slug) {
      const dup = await Category.findOne({ slug, _id: { $ne: category._id } });
      if (dup) return next(ApiError.conflict('Slug already in use'));
      category.slug = slug;
    }

    await category.save();
    ApiResponse.success(res, category, 'Category updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const productsUsing = await Product.countDocuments({ category: req.params.id });
    if (productsUsing > 0) {
      return next(ApiError.badRequest(`Cannot delete: ${productsUsing} product(s) use this category. Reassign them first.`));
    }
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return next(ApiError.notFound('Category not found'));
    ApiResponse.success(res, null, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};
