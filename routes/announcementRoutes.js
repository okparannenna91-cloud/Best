const { Router } = require('express');
const { getActiveAnnouncement } = require('../controllers/announcementController');

const router = Router();

router.get('/', getActiveAnnouncement);

module.exports = router;
