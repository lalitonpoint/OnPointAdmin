const express = require('express');
const router = express.Router();

const loginRoutes = require('../routes/login/loginRoutes'); // Ensure correct path
const dashboardRoutes = require('../routes/dashboard/dashboardRoutes'); // Ensure correct path
const rolesRoutes = require('../routes/rolesManagement/rolesRoutes'); // Ensure correct path
const usersRoutes = require('../routes/usersManagement/usersRoutes'); // Ensure correct path
const fleetRoutes = require('../routes/usersManagement/fleetRoutes'); // Ensure correct path
const orderRoutes = require('../routes/orderManagement/orderRoutes'); // Ensure correct path
const shipmentRoutes = require('../routes/orderManagement/shipmentRoutes'); // Ensure correct path
const warehouseRoutes = require('../routes/warehouseManagement/warehouseRoutes'); // Ensure correct path
const appSettingRoutes = require('../routes/configuration/appSettingRoutes'); // Ensure correct path

const bannerRoutes = require('../routes/websiteManagement/bannerRoutes'); // Ensure correct path
const blogsRoutes = require('../routes/websiteManagement/blogsRoutes'); // Ensure correct path
const galleryRoutes = require('../routes/websiteManagement/galleryRoutes'); // Ensure correct path
const contactRoutes = require('../routes/websiteManagement/contactUsRoutes'); // Ensure correct path
const testimonialRoutes = require('../routes/websiteManagement/testimonialRoutes'); // Ensure correct path
const documentRoutes = require('../routes/driverManagement/documentRoutes'); // Ensure correct path
const driverRoutes = require('../routes/driverManagement/driverRoutes'); // Ensure correct path
const checkLoggedIn = require('../middleware/login/checkLoggedIn'); // Ensure correct path
const logoutRoutes = require('../routes/login/logoutRoutes'); // Ensure correct path
const ptlRoutes = require('./vehcileManagement/partialTruckLoadRoutes'); // Ensure correct path
const serviceRoutes = require('./vehcileManagement/serviceManagementRoutes'); // Ensure correct path
const faqRoutes = require('./faqManagement/faqRoutes'); // Ensure correct path

// Use a base path for login routes

router.use('/login', loginRoutes);
router.get('/logout', logoutRoutes);

router.use(checkLoggedIn);
router.use('/dashboard', dashboardRoutes);
router.use('/roles', rolesRoutes);
router.use('/users', usersRoutes);
router.use('/fleet', fleetRoutes);
router.use('/order', orderRoutes);
router.use('/shipment', shipmentRoutes);
router.use('/warehouse', warehouseRoutes);
router.use('/configuration', appSettingRoutes);

router.use('/banner', bannerRoutes);
router.use('/blogs', blogsRoutes);
router.use('/gallery', galleryRoutes);
router.use('/contactUs', contactRoutes);
router.use('/testimonial', testimonialRoutes);

router.use('/document', documentRoutes);
router.use('/driver', driverRoutes);

router.use('/service', serviceRoutes);
router.use('/faq', faqRoutes);


module.exports = router;
