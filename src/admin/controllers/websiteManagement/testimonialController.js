const Testimonial = require('../../models/websiteManagement/testimonialModel');
const { uploadImage } = require("../../utils/uploadHelper"); // Import helper for file upload
const multiparty = require('multiparty');
const moment = require('moment'); // For date manipulation

const testmonialPage = (req, res) => {
    res.render('pages/websiteManagement/testimonial');
}

// Fetch testimonials (for DataTable)
const testimonialList = async (req, res) => {
    try {
        const { start, length, search, columns, order } = req.body;
        const searchValue = search?.value;
        let query = {};
        let sort = {};

        // Individual column search (for default DataTable search, if you still want to use it)
        // const nameSearch = columns[1]?.search?.value;
        // const designationSearch = columns[2]?.search?.value;
        // const ratingSearch = columns[4]?.search?.value;
        // const statusSearch = columns[5]?.search?.value;
        // const createdAtSearch = columns[6]?.search?.value;

        // Custom search parameters sent from the frontend
        const nameSearch = req.body.name;
        const designationSearch = req.body.designation;
        const ratingSearch = req.body.rating;
        const statusSearch = req.body.status;
        const createdAtSearch = req.body.createdAt;

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
                query.rating = ratingSearch ? parseInt(ratingSearch) : undefined;
                if (query.rating === undefined) {
                    delete query.rating; // Remove from query if empty
                }
            }
            if (statusSearch) {
                // const statusValue = statusSearch === 'Active' ? 1 : (statusSearch === 'Inactive' ? 2 : null);
                if (statusSearch !== null) {
                    query.status = statusSearch;
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

        // Add ordering functionality
        if (order && order.length > 0) {
            const columnIndex = order[0].column;
            const sortDirection = order[0].dir === 'asc' ? 1 : -1;

            // Determine the field to sort by based on the column index
            switch (parseInt(columnIndex)) {
                case 1: // Name column
                    sort.name = sortDirection;
                    break;
                case 2: // Designation column
                    sort.designation = sortDirection;
                    break;
                case 4: // Rating column
                    sort.rating = sortDirection;
                    break;
                case 5: // Status column
                    sort.status = sortDirection;
                    break;
                case 6: // Created At column
                    sort.createdAt = sortDirection;
                    break;
                default:
                    // Default sorting if no valid column is specified (e.g., by creation date descending)
                    sort.createdAt = -1;
                    break;
            }
        } else {
            // Default sorting if no order is specified (e.g., by creation date descending)
            sort.createdAt = -1;
        }

        const testimonials = await Testimonial.find(query)
            .skip(Number(start))
            .limit(Number(length))
            .sort(sort); // Apply the sort order

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
        if (error.code === 11000)
            res.json({ success: false, message: 'Duplicate Value Found' });
        else
            res.status(500).json({ message: error.message });

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

const downloadAllTestimonialsCsv = async (req, res) => {
    try {
        const testimonials = await Testimonial.find().sort({ createdAt: -1 }); // Fetch all testimonials, sorted by creation date (optional)

        if (testimonials.length === 0) {
            return res.status(200).send("No testimonials to download.");
        }

        // Define CSV headers
        const headers = [
            "Name",
            "Designation",
            "Rating",
            "Status",
            "Created At",
            "Message"
        ];

        // Convert testimonial data to CSV format
        const csvRows = testimonials.map(testimonial => [
            `"${testimonial.name.replace(/"/g, '""')}"`, // Escape double quotes
            `"${testimonial.designation.replace(/"/g, '""')}"`,
            testimonial.rating,
            testimonial.status === 1 ? "Active" : "Inactive",
            moment(testimonial.createdAt).format('YYYY-MM-DD HH:mm:ss'),
            `"${testimonial.description.replace(/"/g, '""').replace(/\r?\n|\r/g, ' ')}"` // Escape quotes and replace newlines
        ].join(","));

        // Combine headers and data rows
        const csvData = [headers.join(","), ...csvRows].join("\n");

        // Set response headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="testimonials.csv"');

        // Send the CSV data as the response
        res.status(200).send(csvData);

    } catch (error) {
        console.error("Error downloading all testimonials as CSV:", error);
        res.status(500).send("Error downloading CSV file.");
    }
};

module.exports = {
    testmonialPage,
    getTestimonial,
    saveTestimonial,
    editTestimonial,
    deleteTestimonial,
    testimonialList,
    changeStatus,
    downloadAllTestimonialsCsv // Export the new function
};