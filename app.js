require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db');
const indexRoutes = require('./src/admin/routes/indexRoutes');
const vendorRoutes = require('./src/vendor/routes/indexRoutes');
const apiRoutes = require('./apiRoutes');
const expressLayouts = require('express-ejs-layouts');
const { setGlobalPermissions } = require('./src/admin/middleware/login/checkPermission');

const app = express();

connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: 24000 * 60 * 1000 }
}));

app.use('/vendor', vendorRoutes);


app.use(setGlobalPermissions);

app.use(expressLayouts);
app.set('views', path.join(__dirname, 'src/admin', 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main');
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});


// Routes

app.use('/api', apiRoutes);
app.use('/', indexRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
