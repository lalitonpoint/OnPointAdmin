const vendor = require('../../models/vendorManagement/vendorModel');
const moment = require('moment'); // Ensure moment.js is installed: npm install moment
const multiparty = require('multiparty');
const { uploadImage } = require("../../utils/uploadHelper"); // Import helper for file upload



const vendorPage = (req, res) => {
    res.render('pages/vendorManagement/vendor');
}

// Fetch tracking data (for DataTable)
const vendorList = async (req, res) => {
    try {
        const { start, length, search, columns, order } = req.body;
        const searchValue = search?.value;
        let query = {};
        let sort = {};

        const trackingCodeSearch = req.body.trackingCode;

        const statusSearch = req.body.status;
        const dateSearch = req.body.date; // This corresponds to the frontend's searchDate

        if (searchValue) {
            query.$or = [
                { trackingId: new RegExp(searchValue, 'i') },
                { status: new RegExp(searchValue, 'i') }
                // Add more fields to the global search if needed
            ];
        } else {
            if (trackingCodeSearch) {
                query.trackingId = new RegExp(trackingCodeSearch, 'i');
            }


            if (statusSearch) {
                query.status = parseInt(statusSearch);
            }
            if (dateSearch) {
                const searchMoment = moment(dateSearch);
                const startDate = searchMoment.clone().startOf('day');
                const endDate = searchMoment.clone().endOf('day');

                query.deliveryDate = { // Replace 'yourDateField' with the actual name of the date field in your model
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
                case 5: // No. of Mode column
                    sort.noOfPacking = sortDirection;
                    break;
                case 7: // Delivery Date column (assuming this maps to estimateDate)
                    sort.deliveryDate = sortDirection;
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

        const tracking = await vendor.find(query)
            .skip(Number(start))
            .limit(Number(length))
            .sort(sort); // Apply the sort order

        const totalRecords = await vendor.countDocuments();
        const filteredRecords = await vendor.countDocuments(query);

        res.json({
            draw: req.body.draw,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: tracking
        });
    } catch (error) {
        console.error('Error fetching vendor list:', error);
        res.status(500).json({ error: 'Failed to fetch vendor data' });
    }
};


const addVendor = async (req, res) => {

    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(400).json({ error: "Failed to parse form data" }); // Changed status code to 400 for bad request
            }

            const name = fields.name ? fields.name[0] : '';
            const status = fields.status ? parseInt(fields.status[0]) : null;
            const mobile = fields.mobile ? fields.mobile[0] : ''; // Default to Active
            const email = fields.email ? fields.email[0] : ''; // Default to Active
            const business_name = fields.business_name ? fields.business_name[0] : ''; // Default to Active
             const password = fields.password ? fields.password[0] : ''; // Default to Active
            const business_category = fields.business_category ? fields.business_category[0] : ''; // Default to Active
             const Address = fields.Address ? fields.Address[0] : ''; // Default to Active


            if (!name || !status || !mobile || !email) {
                return res.status(400).json({ message: 'name , Status, mobile , email, Time are required' });
            }

            // Convert status to number
            const statusNumber = parseInt(status);
            if (isNaN(statusNumber) || statusNumber < 1 || statusNumber > 5) {
                return res.status(400).json({ message: 'Invalid status value' });
            }
            const statusMap = {
                1: { key: 'active', status: 0, deliveryDateTime: '' },
                2: { key: 'inactive', status: 0, deliveryDateTime: '' }
            };
            statusMap[status].status = 1;
            statusMap[status].deliveryDateTime = new Date();
            // console.log(statusMap[status].status); // Output: 0

            // Create a new tracking entry
            const newvendor = new vendor({
                name: name,
                // deliveryDate: moment(deliveryDate).toDate(), // Convert string to Date object using moment for consistency
                mobile: mobile || null,
                email: email || null,
                password: password || null,
                business_name: business_name || null,
                business_category : business_category || null,
                address : Address ,
                status: statusNumber,
                // deliveryTime: deliveryTime,
                createdAt: new Date()
            });

            // Save the new tracking entry to the database
            await newvendor.save();

            // Send success response with a more standard status code
            res.status(201).json({ message: 'vendor added successfully', data: newvendor });
        });
    } catch (err) {
        console.error('Error adding vendor:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

const getvendorbyId = async (req, res) => {
    try {
        const tracking = await vendor.findById(req.params.id);
        if (!tracking) {
            return res.status(404).json({ message: 'Tracking not found' });
        }
        res.json(tracking);
    } catch (error) {
        console.error('Error fetching tracking by ID:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const editVendor = async (req, res) => {


    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(400).json({ error: "Failed to parse form data" }); // Changed status code to 400 for bad request
            }
            const { id } = req.params;



            const name = fields.name ? fields.name[0] : '';
            const status = fields.status ? parseInt(fields.status[0]) : null;
            const mobile = fields.mobile ? fields.mobile[0] : ''; // Default to Active
            const email = fields.email ? fields.email[0] : ''; // Default to Active
            const business_name = fields.business_name ? fields.business_name[0] : ''; // Default to Active
             const password = fields.password ? fields.password[0] : ''; // Default to Active
            const business_category = fields.business_category ? fields.business_category[0] : ''; // Default to Active
             const Address = fields.Address ? fields.Address[0] : ''; // Default to Active

            // const deliveryDate = fields.deliveryDate ? fields.deliveryDate[0] : '';
            // const deliveryTime = fields.deliveryTime ? fields.deliveryTime[0] : '';
            // const file = files.pod ? files.pod[0] : null;


            if (!name || mobile === null || status === null || email === null || business_name === null || business_category === null) { // Corrected the validation for bannerType and status
                return res.status(400).json({ error: "Tracking Code, status , PickUpLocation , dropLocation , transportMode & noOfPacking are required" });
            }

            const existingTrack = await vendor.findById(id);
            if (!existingTrack) {
                return res.status(404).json({ success: false, message: 'vendor not found' });
            }
            // let imageUrl = existingTrack.pod; // Default to existing image
            // if (file) {
            //     const result = await uploadImage(file);
            //     imageUrl = result.success ? result.url : imageUrl;
            // }


            const existingTrackk = await vendor.findById(id);

            if (!existingTrackk) {
                return res.status(404).json({ success: false, message: 'vendor not found' });
            }

            // Clone current deliveryStatus
            const updatedDeliveryStatus = { ...existingTrackk.deliveryStatus };

            // Update the current step status
            if (updatedDeliveryStatus[status]) {
                updatedDeliveryStatus[status].status = 1; // or whatever value you want
                updatedDeliveryStatus[status].deliveryDateTime = new Date(); // or whatever value you want
            }

            // Optionally reset other statuses to 0 if needed
            // for (const key in updatedDeliveryStatus) {
            //   if (key != status) updatedDeliveryStatus[key].status = 0;
            // }

            const updatedTracking = await vendor.findByIdAndUpdate(
                id,
                {
                    name: name,
                    mobile : mobile,
                    email,
                    password,
                    business_name,
                    business_category,
                    Address,
                    status: parseInt(status), //currentstatus
                    deliveryStatus: updatedDeliveryStatus // ✅ save the updated object
                },
                { new: true } // Return the updated document
            );

            if (!updatedTracking) {
                return res.status(404).json({ message: 'vendor not found' });
            }

            await vendor.findByIdAndUpdate(id, updatedTracking);


            res.json({ message: 'Vendor updated successfully', data: updatedTracking });
        });
    } catch (error) {
        console.error('Error updating vendor:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }

};


const deletevendor = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTracking = await vendor.findByIdAndDelete(id);

        if (!deletedTracking) {
            return res.status(404).json({ message: 'vendor not found' });
        }

        res.json({ message: 'vendor deleted successfully' });

    } catch (error) {
        console.error('Error deleting vendor:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const downloadTrackingCsv = async (req, res) => {
    try {
        const { trackingCode, status, date } = req.query;
        let query = {};

        if (trackingCode) {
            query.trackingId = new RegExp(trackingCode, 'i');
        }
        if (status) {
            query.status = parseInt(status);
        }
        if (date) {
            const startDate = moment(date).startOf('day');
            const endDate = moment(date).endOf('day');
            query.estimateDate = {
                $gte: startDate.toDate(),
                $lte: endDate.toDate()
            };
        }

        const trackings = await Tracking.find(query).sort({ createdAt: -1 });

        if (trackings.length === 0) {
            return res.status(200).send("No tracking data found for the current filters.");
        }

        const csvHeaders = [
            "#",
            "Tracking ID",
            "Pickup Location",
            "Drop Location",
            "Transport Mode",
            "No. of Packing",
            "Status",
            "Delivery Date",
            "Created At"
        ];

        const csvData = trackings.map((tracking, index) => [
            index + 1,
            tracking.trackingId,
            tracking.pickUpLocation || '',
            tracking.dropLocation || '',
            tracking.transportMode || '',
            tracking.noOfPacking,
            getStatusText(tracking.status), // Assuming you have a function to convert status code to text
            moment(tracking.deliveryDate).format('YYYY-MM-DD HH:mm:ss'),
            moment(tracking.createdAt).format('YYYY-MM-DD HH:mm:ss')
        ]);

        // Helper function to convert status code to text
        function getStatusText(status) {
            switch (status) {
                case 1: return 'Pickup';
                case 2: return 'Out for Delivery';
                case 3: return 'In Progress';
                case 4: return 'Delivered';
                case 5: return 'Cancelled';
                default: return 'Unknown';
            }
        }

        // Format the CSV data
        const csvRows = [csvHeaders, ...csvData].map(row => row.join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="tracking_data.csv"');
        res.status(200).send(csvRows);

    } catch (error) {
        console.error('Error downloading tracking CSV:', error);
        res.status(500).send("Error generating CSV file.");
    }
};

module.exports = {
    vendorPage,
    vendorList,
    addVendor,
    getvendorbyId,
    editVendor,
    deletevendor,
    downloadTrackingCsv
};
