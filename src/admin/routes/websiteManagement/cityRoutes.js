
const express = require('express');
const router = express.Router();

const cityCTRL = require('../../controllers/websiteManagement/cityController');

router.get('/importcsv', cityCTRL.importCSV);
router.get('/cities', cityCTRL.getCities);
router.post('/addcities', cityCTRL.addCities);

module.exports = router;
