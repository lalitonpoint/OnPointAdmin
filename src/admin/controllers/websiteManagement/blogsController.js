const Blog = require('../../models/websiteManagement/blogModel'); // Mongoose Blog model
const { uploadImage } = require("../../utils/uploadHelper"); // Import helper for file upload
const multiparty = require('multiparty');
const moment = require('moment'); // For date manipulation


// Render the blog management page
const blogsPage = (req, res) => {
    res.render('pages/websiteManagement/blogs');
};

// Fetch list of blogs (for DataTable)
const blogsList = async (req, res) => {
    try {
        const { start, length, search, columns, order } = req.body;
        const searchValue = search?.value;
        let query = {};
        let sort = {};

        // Custom search parameters sent from the frontend
        const titleSearch = req.body.title;
        const tagsSearch = req.body.tags;
        const statusSearch = req.body.status;
        const createdAtSearch = req.body.createdAt;

        if (searchValue) {
            query.$or = [
                { title: new RegExp(searchValue, 'i') },
                { description: new RegExp(searchValue, 'i') },
                { tags: new RegExp(searchValue, 'i') }
                // You can add more fields to the global search if needed
            ];
        } else {
            if (titleSearch) {
                query.title = new RegExp(titleSearch, 'i');
            }
            if (tagsSearch) {
                query.tags = new RegExp(tagsSearch, 'i');
            }
            if (statusSearch) {
                query.status = statusSearch;
            }
            if (createdAtSearch) {
                const startDate = moment(createdAtSearch).startOf('day');
                const endDate = moment(createdAtSearch).endOf('day');
                query.createdAt = {
                    $gte: startDate.toDate(),
                    $lte: endDate.toDate()
                };
            }
        }

        // Add ordering functionality
        if (order && order.length > 0) {
            const columnIndex = order[0].column;
            const sortDirection = order[0].dir === 'asc' ? 1 : -1;

            switch (parseInt(columnIndex)) {
                case 1: // Title column
                    sort.title = sortDirection;
                    break;
                case 3: // Tags column
                    sort.tags = sortDirection;
                    break;
                case 4: // Status column
                    sort.status = sortDirection;
                    break;
                case 5: // Created At column
                    sort.createdAt = sortDirection;
                    break;
                default:
                    sort.createdAt = -1;
                    break;
            }
        } else {
            sort.createdAt = -1;
        }

        const blogs = await Blog.find(query)
            .skip(Number(start))
            .limit(Number(length))
            .sort(sort);

        const totalRecords = await Blog.countDocuments();
        const filteredRecords = await Blog.countDocuments(query);

        res.json({
            draw: req.body.draw,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: blogs
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new blog
const createBlog = async (req, res) => {
    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(500).json({ error: "Failed to parse form data" });
            }

            const title = fields.title ? fields.title[0] : '';
            const status = fields.status ? fields.status[0] : '';
            const tags = fields.tags ? fields.tags[0] : '';
            const description = fields.description ? fields.description[0] : '';

            if (!title || !status || !tags || !description) {
                return res.status(400).json({ error: "Title, status, tags, and description are required" });
            }

            const file = files.image ? files.image[0] : null;

            const result = await uploadImage(file);
            const imageUrl = result.success ? result.url : `http://localhost:${process.env.PORT || 3000}${result.path}`;

            const blog = new Blog({
                title,
                description,
                tags,
                status,
                image: imageUrl,
            });

            await blog.save();
            res.json({ success: true, message: 'Blog saved successfully' });
        });
    } catch (error) {
        console.error("Error saving blog:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get a specific blog for editing
const getBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blog', details: error.message });
    }
};

// Update an existing blog
const updateBlog = async (req, res) => {
    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(500).json({ error: "Failed to parse form data" });
            }

            const title = fields.title ? fields.title[0] : '';
            const status = fields.status ? fields.status[0] : '';
            const tags = fields.tags ? fields.tags[0] : '';
            const description = fields.description ? fields.description[0] : '';

            const { id } = req.params;

            const existingBlog = await Blog.findById(id);
            if (!existingBlog) {
                return res.status(404).json({ success: false, message: 'Blog not found' });
            }

            let imageUrl = existingBlog.image; // Default to existing image

            const file = files.image ? files.image[0] : null;

            if (file) {
                const result = await uploadImage(file);
                imageUrl = result.success ? result.url : imageUrl;
            }

            const updateData = {
                title,
                description,
                tags,
                status,
                updatedAt: new Date(),
                image: imageUrl
            };

            await Blog.findByIdAndUpdate(id, updateData);
            res.json({ success: true, message: 'Blog updated successfully' });
        });
    } catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Delete a blog
const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;
        await Blog.findByIdAndDelete(id);
        res.json({ success: true, message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Change Status of a blog
const changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Expect the new status value in the request body

        if (status === undefined || status === null) {
            return res.status(400).json({ error: 'Status value is required in the request body.' });
        }

        const updatedBlog = await Blog.findByIdAndUpdate(id, { status }, { new: true });

        if (!updatedBlog) {
            return res.status(404).json({ success: false, message: 'Blog not found.' });
        }

        res.json({ success: true, message: 'Blog status updated successfully', data: updatedBlog });
    } catch (error) {
        console.error('Error updating blog status:', error);
        if (error.code === 11000)
            res.json({ success: false, message: 'Duplicate Value Found' });
        else
            res.status(500).json({ message: error.message });
    }
};

const downloadAllCsv = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });

        if (blogs.length === 0) {
            return res.status(200).send("No blogs to download.");
        }

        const headers = [
            "Title",
            "Status",
            "Created At"
        ];

        const csvRows = blogs.map(blog => [
            `"${blog.title.replace(/"/g, '""')}"`,
            blog.status == '1' ? 'Active' : 'In-Active',
            moment(blog.createdAt).format('YYYY-MM-DD HH:mm:ss')
        ].join(","));

        const csvData = [headers.join(","), ...csvRows].join("\n");

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="blogs.csv"');

        res.status(200).send(csvData);

    } catch (error) {
        console.error("Error downloading all blogs as CSV:", error);
        res.status(500).send("Error downloading CSV file.");
    }
};

module.exports = {
    blogsPage,
    blogsList,
    createBlog,
    getBlog,
    updateBlog,
    deleteBlog,
    changeStatus,
    downloadAllCsv
};