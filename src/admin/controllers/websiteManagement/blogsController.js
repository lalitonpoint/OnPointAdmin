const Blog = require('../../models/websiteManagement/blogModel'); // Mongoose Blog model
const multer = require('multer');
const path = require('path');

// Render the blog management page
const blogsPage = (req, res) => {
    res.render('pages/WebsiteManagement/blogs');
};

// Fetch list of blogs
const blogsList = async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.json({ data: blogs });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch blogs' });
    }
};

// Create a new blog
// const createBlog = async (req, res) => {
//     const { blog_title, blog_description, blog_tags, blog_status } = req.body;

//     try {
//         const newBlog = new Blog({
//             title: blog_title,
//             description: blog_description,
//             tags: blog_tags,
//             status: blog_status,
//             banner_image: '',
//             poster_image: '',
//         });

//         await newBlog.save();
//         res.redirect('/admin/blogs');
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };


const createBlog = async (req, res) => {
    try {
        const { title, description, tags, status } = req.body;
        console.log('ghjkl->' + req.data);
        const blog = new Blog({ title, description, tags, status });
        await blog.save();
        res.json({ success: true, message: 'Blog saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update an existing blog
const updateBlog = async (req, res) => {
    const { blog_id, blog_title, blog_description, blog_tags, blog_status } = req.body;

    try {
        let updateData = {
            title: blog_title,
            description: blog_description,
            tags: blog_tags,
            status: blog_status,
        };

        // Update images if they are provided
        if (req.files?.banner_image) updateData.banner_image = req.files.banner_image[0].filename;
        if (req.files?.poster_image) updateData.poster_image = req.files.poster_image[0].filename;

        await Blog.findByIdAndUpdate(blog_id, updateData, { new: true });
        res.redirect('/admin/blogs');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a blog
const deleteBlog = async (req, res) => {
    try {
        await Blog.findByIdAndDelete(req.params.id);
        res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    blogsPage,
    blogsList,
    createBlog,
    updateBlog,
    deleteBlog
};
