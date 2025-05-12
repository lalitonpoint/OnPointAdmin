
const express = require('express');
const router = express.Router();
const { walletAuthentication } = require('../middleware/razorpay');

const WalletCtrl = require('../controllers/walletController')

router.get('/balance', WalletCtrl.walletBalance);
router.post('/addMoney', walletAuthentication, WalletCtrl.addMoney);
router.get('/transactions', walletAuthentication, WalletCtrl.walletTransaction);
router.post('/verify', walletAuthentication, WalletCtrl.walletVerify);
router.post('/use', walletAuthentication, WalletCtrl.walletUse);
router.post('/refund', walletAuthentication, WalletCtrl.walletRefund);
// router.post('/webhookHandler', express.json({ type: '*/*' }), WalletCtrl.webhookHandler);

module.exports = router;
