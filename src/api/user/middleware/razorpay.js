const Wallet = require('../models/walletModal');

const walletAuthentication = async (req, res, next) => {
    const userId = req.headers['userid'];

    let wallet = await Wallet.findOne({ userId: userId });
    if (!wallet) {
        wallet = await Wallet.create({ userId: userId });
    }
    req.wallet = wallet;
    next();
};

module.exports = { walletAuthentication }