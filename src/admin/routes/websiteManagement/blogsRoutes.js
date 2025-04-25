const express = require('express');
const router = express.Router();
const BlogsCtrl = require('../../controllers/websiteManagement/blogsController');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');

router.get('/blogsManagement', checkCrudPermission(), BlogsCtrl.blogsPage);

router.post("/blogsList", checkCrudPermission('isShow'), BlogsCtrl.blogsList);

router.post('/addBlog', checkCrudPermission('add'), BlogsCtrl.createBlog); // Changed '/saveBlog' to '/addBlog' to align with the HTML

router.get('/getBlog/:id', checkCrudPermission('edit'), BlogsCtrl.getBlog); // Added route to fetch a single blog

router.post('/editBlog/:id', checkCrudPermission('edit'), BlogsCtrl.updateBlog); // Changed '/updateBlog' to '/editBlog' to align with the HTML

router.delete('/deleteBlog/:id', checkCrudPermission('delete'), BlogsCtrl.deleteBlog);

router.post('/changeStatus/:id', checkCrudPermission('edit'), BlogsCtrl.changeStatus); // Added route to change blog status

router.get('/downloadAllCsv', checkCrudPermission('export'), BlogsCtrl.downloadAllCsv); // Added route for CSV download

module.exports = router;