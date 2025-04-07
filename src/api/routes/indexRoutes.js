
const express = require('express');
const router = express.Router();

// const authRoutes = require('./authRoutes'); // Ensure correct path
const webRoutes = require('./webRoutes'); // Ensure correct path
const contactUsRoutes = require('./contactUsRoutes');

router.use('/web', webRoutes);
router.use('/contactus', contactUsRoutes);

module.exports = router;
