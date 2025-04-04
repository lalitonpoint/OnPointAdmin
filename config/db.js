const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // await mongoose.connect('mongodb://localhost:27017/OnPointsLogistics', {
        await mongoose.connect('mongodb+srv://onpointlogistics688:vAfVPAi5d5e2Wl7b@cluster0.mcl2w.mongodb.net/onpoint?retryWrites=true&w=majority', {

            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (err) {
        console.error('Connection error', err);
        process.exit(1);
    }
};

module.exports = connectDB;
