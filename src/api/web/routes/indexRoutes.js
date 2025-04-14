const express = require('express');
const router = express.Router();

const contactUsRoutes = require('../routes/contactUsRoutes');
const webRoutes = require('../routes/webRoutes');
const trackingRoutes = require('../routes/trackingRoutes');

router.use('/contactus', contactUsRoutes);
router.use('/home', webRoutes);
router.use('/tracking', trackingRoutes);


module.exports = router;
