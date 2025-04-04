

const Testimonial = require('../../models/websiteManagement/testimonialModel');
const { uploadImage } = require("../../utils/uploadHelper"); // Import helper for file upload
const multiparty = require('multiparty');

const testmonialPage = (req, res) => {
    res.render('pages/WebsiteManagement/testimonial');
}

// Fetch testimonials (for DataTable)
const testimonialList = async (req, res) => {
    try {
        const { start, length, search } = req.body;
        let query = {};
        if (search?.value) {
            query = { name: new RegExp(search.value, 'i') };
        }

        const testimonials = await Testimonial.find(query).skip(Number(start)).limit(Number(length));
        const totalRecords = await Testimonial.countDocuments();
        const filteredRecords = await Testimonial.countDocuments(query);

        res.json({
            draw: req.body.draw,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: testimonials
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const saveTestimonial = async (req, res) => {
    try {
        const form = new multiparty.Form();

        // Parse the form data
        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(500).json({ error: "Failed to parse form data" });
            }

            // Extract data from fields
            const name = fields.name ? fields.name[0] : '';
            const status = fields.status ? fields.status[0] : '';
            const designation = fields.designation ? fields.designation[0] : '';
            const rating = fields.rating ? fields.rating[0] : '';
            const description = fields.description ? fields.description[0] : '';

            // Validation for required fields
            if (!name || !status || !designation || !rating || !description) {
                return res.status(400).json({ error: "Name, status, designation, rating, and description are required" });
            }

            // Handle file upload
            const file = files.image ? files.image[0] : null;
            if (!file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            if (!file.path || !file.originalFilename) {
                return res.status(400).json({ error: "File data is incomplete" });
            }

            // Upload the image and get the file URL
            const result = await uploadImage(file);
            const imageUrl = result.success ? result.url : `http://localhost:${process.env.PORT || 3000}${result.path}`;

            // Create a new Testimonial document with the data from the form
            const testimonial = new Testimonial({
                name,
                designation,
                rating,
                description,
                profileImage: imageUrl, // Save the file path in the database
            });

            // Save the testimonial to the database
            await testimonial.save();

            // Return success response
            res.json({ success: true, message: 'Testimonial saved successfully' });
        });

    } catch (error) {
        console.error("Error saving testimonial:", error);
        res.status(500).json({ error: error.message });
    }
};

// Edit testimonial
const editTestimonial = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, message } = req.body;
        await Testimonial.findByIdAndUpdate(id, { name, message, updatedAt: new Date() });
        res.json({ success: true, message: 'Testimonial updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete testimonial
const deleteTestimonial = async (req, res) => {
    try {
        const { id } = req.params;
        await Testimonial.findByIdAndDelete(id);
        res.json({ success: true, message: 'Testimonial deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
        res.json(testimonial);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching testimonial', details: error.message });
    }
};

module.exports = { testmonialPage, getTestimonial, saveTestimonial, editTestimonial, deleteTestimonial, testimonialList }
