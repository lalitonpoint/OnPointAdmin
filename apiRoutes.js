const express = require('express');
const router = express.Router();

// const driverRoutes = require('./src/api/driver/routes/indexRoutes');
const userRoutes = require('./src/api/user/routes/indexRoutes');
const webRoutes = require('./src/api/web/routes/indexRoutes');

// router.use('/driver', driverRoutes);
router.use('/user', userRoutes);
router.use('/web', webRoutes);


module.exports = router;
