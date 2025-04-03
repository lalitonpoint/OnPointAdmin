require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db');
const indexRoutes = require('./src/admin/routes/indexRoutes');
const apiRoutes = require('./src/api/routes/indexRoutes');
const expressLayouts = require('express-ejs-layouts');
const { setGlobalPermissions } = require('./src/admin/middleware/login/checkPermission');
const checkLoggedIn = require('./src/admin/middleware/login/checkLoggedIn');

const app = express();

connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 10 * 60 * 100000 } // 10 minutes
}));

app.use(setGlobalPermissions);

app.use(expressLayouts);
app.set('views', path.join(__dirname, 'src/admin', 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main');
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Routes
app.use('/', indexRoutes);
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
