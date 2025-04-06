const Testimonial = require('../../models/websiteManagement/testimonialModel');
const { uploadImage } = require("../../utils/uploadHelper"); // Import helper for file upload
const multiparty = require('multiparty');
const moment = require('moment'); // For date manipulation

const testmonialPage = (req, res) => {
    res.render('pages/WebsiteManagement/testimonial');
}

// Fetch testimonials (for DataTable)
const testimonialList = async (req, res) => {
    try {
        const { start, length, search, columns } = req.body;
        const searchValue = search?.value;
        let query = {};

        // Individual column search
        const nameSearch = columns[1]?.search?.value;
        const designationSearch = columns[2]?.search?.value;
        const ratingSearch = columns[4]?.search?.value;
        const statusSearch = columns[5]?.search?.value;
        const createdAtSearch = columns[6]?.search?.value;

        if (searchValue) {
            query.$or = [
                { name: new RegExp(searchValue, 'i') },
                { designation: new RegExp(searchValue, 'i') }
                // You can add more fields to the global search if needed
            ];
        } else {
            if (nameSearch) {
                query.name = new RegExp(nameSearch, 'i');
            }
            if (designationSearch) {
                query.designation = new RegExp(designationSearch, 'i');
            }
            if (ratingSearch) {
                query.rating = parseInt(ratingSearch);
            }
            if (statusSearch) {
                const statusValue = statusSearch === 'Active' ? 1 : (statusSearch === 'Inactive' ? 2 : null);
                if (statusValue !== null) {
                    query.status = statusValue;
                }
            }
            if (createdAtSearch) {
                // Basic date range search (assuming createdAt is a Date object)
                const startDate = moment(createdAtSearch).startOf('day');
                const endDate = moment(createdAtSearch).endOf('day');
                query.createdAt = {
                    $gte: startDate.toDate(),
                    $lte: endDate.toDate()
                };
            }
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
                status: parseInt(status), // Ensure status is an integer
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
        const form = new multiparty.Form();

        // Parse the form data
        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(500).json({ error: "Failed to parse form data" });
            }

            const name = fields.name ? fields.name[0] : '';
            const designation = fields.designation ? fields.designation[0] : '';
            const rating = fields.rating ? fields.rating[0] : '';
            const status = fields.status ? fields.status[0] : '';
            const description = fields.description ? fields.description[0] : '';

            const { id } = req.params;

            const existingTestimonial = await Testimonial.findById(id);
            if (!existingTestimonial) {
                return res.status(404).json({ success: false, message: 'Testimonial not found' });
            }

            let imageUrl = existingTestimonial.profileImage; // Default to existing image

            const file = files.image ? files.image[0] : null;

            if (file) {
                const result = await uploadImage(file);
                imageUrl = result.success ? result.url : imageUrl;
            }

            const updateData = {
                name,
                designation,
                rating: parseInt(rating), // Ensure rating is an integer
                status: parseInt(status), // Ensure status is an integer
                description,
                updatedAt: new Date(),
                profileImage: imageUrl
            };

            await Testimonial.findByIdAndUpdate(id, updateData);
            res.json({ success: true, message: 'Testimonial updated successfully' });
        });
    } catch (error) {
        console.error('Error updating testimonial:', error);
        res.status(500).json({ success: false, error: error.message });
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

//Change Status

const changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Expect the new status value in the request body

        if (status === undefined || status === null) {
            return res.status(400).json({ error: 'Status value is required in the request body.' });
        }

        const updatedTestimonial = await Testimonial.findByIdAndUpdate(id, { status: parseInt(status) }, { new: true });

        if (!updatedTestimonial) {
            return res.status(404).json({ success: false, message: 'Testimonial not found.' });
        }

        res.json({ success: true, message: 'Testimonial status updated successfully', data: updatedTestimonial });
    } catch (error) {
        console.error('Error updating testimonial status:', error);
        res.status(500).json({ error: error.message });
    }
}



const getTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
        res.json(testimonial);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching testimonial', details: error.message });
    }
};

module.exports = { testmonialPage, getTestimonial, saveTestimonial, editTestimonial, deleteTestimonial, testimonialList, changeStatus };
