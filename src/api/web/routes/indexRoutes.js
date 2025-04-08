const express = require('express');
const router = express.Router();

const contactUsRoutes = require('../routes/contactUsRoutes');
const webRoutes = require('../routes/webRoutes');

router.use('/contactus', contactUsRoutes);
router.use('/home', webRoutes);


module.exports = router;
