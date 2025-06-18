
const dashboardPage = (req, res) => {
    res.render('pages/dashboard/', {
        title: 'Dashboard',
        layout: 'layouts/main'
    });
};


module.exports = {
    dashboardPage
}