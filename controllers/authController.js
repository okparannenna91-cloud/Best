const crypto = require('crypto');
const { clerkClient } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');
const Wishlist = require('../models/Wishlist');
const ApiResponse = require('../utils/ApiResponse');
const emailService = require('../config/email');

exports.clerkWebhook = async (req, res, next) => {
  try {
    const svixSignature = req.headers['svix-signature'];
    const svixId = req.headers['svix-id'];
    const svixTimestamp = req.headers['svix-timestamp'];
    const secret = process.env.CLERK_WEBHOOK_SECRET;

    if (!svixSignature || !svixId || !svixTimestamp || !secret) {
      return res.status(401).json({ error: 'Missing webhook verification' });
    }

    const rawBody = req.rawBody;
    if (!rawBody) return res.status(401).json({ error: 'Missing raw body' });

    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(signedContent).digest('base64');

    const signatures = svixSignature.split(',').map(s => s.trim());
    const valid = signatures.some(s => {
      const [version, sig] = s.split('=');
      return version === 'v1' && sig === expectedSig;
    });

    if (!valid) return res.status(401).json({ error: 'Invalid webhook signature' });

    const { type, data } = req.body;

    if (type === 'user.created') {
      const clerkUser = data;
      const email = clerkUser.email_addresses?.[0]?.email_address || '';
      const user = await User.create({
        clerkId: clerkUser.id,
        email,
        firstName: clerkUser.first_name || '',
        lastName: clerkUser.last_name || '',
        avatar: clerkUser.image_url || '',
      });
      await Wishlist.create({ user: user._id, products: [] });
      emailService.sendWelcomeEmail(email, user.firstName).catch(err => console.error('Welcome email error:', err.message));
    }

    if (type === 'user.updated') {
      const clerkUser = data;
      const email = clerkUser.email_addresses?.[0]?.email_address || '';
      let user = await User.findOne({ clerkId: clerkUser.id });
      if (user) {
        user.email = email;
        user.firstName = clerkUser.first_name || user.firstName;
        user.lastName = clerkUser.last_name || user.lastName;
        user.avatar = clerkUser.image_url || user.avatar;
        await user.save();
      }
    }

    if (type === 'user.deleted') {
      const user = await User.findOne({ clerkId: data.id });
      if (user) {
        await Wishlist.deleteOne({ user: user._id });
        await user.deleteOne();
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

exports.getUserByClerkId = async (clerkId) => {
  return await User.findOne({ clerkId }).populate('addresses');
};
