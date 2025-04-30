
const express = require('express');
const router = express.Router();

const { createContact } = require('./../controllers/contactUsController')

router.post('/createContact', createContact);

module.exports = router; 
