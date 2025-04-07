const express = require('express');
const router = express.Router();
const BlogsCtrl = require('../../controllers/websiteManagement/blogsController');

// Route to render the blogs management page
router.get('/blogsManagement', BlogsCtrl.blogsPage);

// Route to fetch the list of blogs for the datatable
router.post("/blogsList", BlogsCtrl.blogsList);

// Route to save a new blog
router.post('/addBlog', BlogsCtrl.createBlog); // Changed '/saveBlog' to '/addBlog' to align with the HTML

// Route to get a specific blog for editing
router.get('/getBlog/:id', BlogsCtrl.getBlog); // Added route to fetch a single blog

// Route to update an existing blog
router.post('/editBlog/:id', BlogsCtrl.updateBlog); // Changed '/updateBlog' to '/editBlog' to align with the HTML

// Route to delete a blog
router.delete('/deleteBlog/:id', BlogsCtrl.deleteBlog);

// Route to change the status of a blog
router.post('/changeStatus/:id', BlogsCtrl.changeStatus); // Added route to change blog status

// Route to download all blogs as CSV
router.get('/downloadAllCsv', BlogsCtrl.downloadAllCsv); // Added route for CSV download

module.exports = router;