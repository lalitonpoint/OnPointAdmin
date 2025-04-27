module.exports = (req, res, next) => {
    if (req.session && req.session.isLoggedIn) {
        // User is logged in
        // console.log('session', req.session.modulePermissions);

        if (req.originalUrl === '/' || req.originalUrl === '/login') {
            return res.redirect('/dashboard'); // Redirect to dashboard if trying to access login page while logged in
        } else {
            // User is logged in and trying to access other pages, allow access
            return next();
        }
    } else {
        // User not logged in

        if (req.originalUrl === '/login') {
            return next(); // Allow access to the login page
        } else if (req.originalUrl === '/') {
            return res.redirect('/login'); // Redirect root to login if not logged in (optional, depending on your setup)
        }
        else {
            return res.redirect('/login');
        }
    }
};