const express = require('express');
const router = express.Router();
const BlogsCtrl = require('../../controllers/websiteManagement/blogsController');

// Route to render the blogs management page
router.get('/blogsManagement', BlogsCtrl.blogsPage);

// Route to fetch the list of blogs
router.post("/blogsList", BlogsCtrl.blogsList);

// Route to save a new blog
router.post('/saveBlog', BlogsCtrl.createBlog);

// Route to update an existing blog
router.post('/updateBlog/:id', BlogsCtrl.updateBlog);

// Route to delete a blog
router.delete('/deleteBlog/:id', BlogsCtrl.deleteBlog);

module.exports = router;
