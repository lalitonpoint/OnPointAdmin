
const express = require('express');
const router = express.Router();

// const authRoutes = require('./authRoutes'); // Ensure correct path
const webRoutes = require('./webRoutes'); // Ensure correct path

router.use('/web', webRoutes);

module.exports = router;
