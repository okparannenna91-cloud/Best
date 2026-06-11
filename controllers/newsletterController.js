const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const emailService = require('../config/email');

exports.subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;

    const existing = await NewsletterSubscriber.findOne({ email });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.unsubscribedAt = null;
        await existing.save();
        emailService.sendNewsletterWelcome(email, existing.token).catch(err => console.error('Newsletter welcome email error:', err.message));
        return ApiResponse.success(res, null, 'Successfully re-subscribed');
      }
      return ApiResponse.success(res, null, 'You are already subscribed');
    }

    const subscriber = await NewsletterSubscriber.create({ email });
    emailService.sendNewsletterWelcome(email, subscriber.token).catch(err => console.error('Newsletter welcome email error:', err.message));
    ApiResponse.success(res, null, 'Successfully subscribed to newsletter', 201);
  } catch (error) {
    next(error);
  }
};

exports.unsubscribe = async (req, res, next) => {
  try {
    const subscriber = await NewsletterSubscriber.findOne({ token: req.params.token });
    if (!subscriber) return next(ApiError.notFound('Invalid unsubscribe link'));

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    ApiResponse.success(res, null, 'Successfully unsubscribed');
  } catch (error) {
    next(error);
  }
};
