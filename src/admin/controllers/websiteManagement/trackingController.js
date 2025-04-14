const Tracking = require('../../models/websiteManagement/trackingModel');
const trackingPage = (req, res) => {
    res.render('pages/websiteManagement/tracking');
}

// Fetch testimonials (for DataTable)
const trackingList = async (req, res) => {
    try {
        const { start, length, search, columns, order } = req.body;
        const searchValue = search?.value;
        let query = {};
        let sort = {};

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

        const tracking = await Tracking.find(query)
            .skip(Number(start))
            .limit(Number(length))
            .sort(sort); // Apply the sort order

        const totalRecords = await Tracking.countDocuments();
        const filteredRecords = await Tracking.countDocuments(query);

        res.json({
            draw: req.body.draw,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: tracking
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const addTracking = async (req, res) => {
    try {
        const { trackingCode, status, createdAt } = req.body;

        // Check if all required fields are provided
        if (!trackingCode || !status || !createdAt) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Create a new tracking entry
        const newTracking = new Tracking({
            tracking_id: trackingCode,
            status: status, // The status should be a number (1-5)
            date: createdAt,
        });

        // Save the new tracking entry to the database
        await newTracking.save();

        // Send success response
        res.status(201).json({ message: 'Tracking added successfully', data: newTracking });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
module.exports = {
    trackingPage,
    trackingList,
    addTracking
};