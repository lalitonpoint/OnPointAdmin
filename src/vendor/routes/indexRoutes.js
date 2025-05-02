const express = require('express');
const router = express.Router();

const loginRoutes = require('../routes/loginRoutes'); // Ensure correct path
router.use('/login', loginRoutes);

module.exports = router;
