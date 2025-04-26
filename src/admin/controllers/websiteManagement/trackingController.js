const Tracking = require('../../models/websiteManagement/trackingModel');
const moment = require('moment'); // Ensure moment.js is installed: npm install moment
const multiparty = require('multiparty');
const { uploadImage } = require("../../utils/uploadHelper"); // Import helper for file upload


const trackingPage = (req, res) => {
    res.render('pages/websiteManagement/tracking');
}

// Fetch tracking data (for DataTable)
const trackingList = async (req, res) => {
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
        console.error('Error fetching tracking list:', error);
        res.status(500).json({ error: 'Failed to fetch tracking data' });
    }
};


const addTracking = async (req, res) => {

    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(400).json({ error: "Failed to parse form data" }); // Changed status code to 400 for bad request
            }

            const trackingCode = fields.trackingCode ? fields.trackingCode[0] : '';
            const status = fields.status ? parseInt(fields.status[0]) : null;
            const pickUpLocation = fields.pickUpLocation ? fields.pickUpLocation[0] : ''; // Default to Active
            const dropLocation = fields.dropLocation ? fields.dropLocation[0] : ''; // Default to Active
            const transportMode = fields.transportMode ? fields.transportMode[0] : ''; // Default to Active
            const noOfPacking = fields.noOfPacking ? parseInt(fields.noOfPacking[0]) : 1; // Default to Active
            const deliveryDate = fields.deliveryDate ? fields.deliveryDate[0] : ''; // Default to Active
            const estimateDate = fields.estimateDate ? fields.estimateDate[0] : ''; // Default to Active
            const transitTracking = fields.transitData ? fields.transitData : []; // not [0] if you want full array

            const checkExistingTrackingCode = await Tracking.find({ 'trackingCode': trackingCode });

            if (!checkExistingTrackingCode) {
                return res.status(200).json({ success: false, message: 'Track Id Already Registered' });
            }

            let parsedTransitTracking = [];
            if (transitTracking.length > 0) {
                parsedTransitTracking = transitTracking.map(item => {
                    try {
                        return JSON.parse(item); // Parse each item into an object
                    } catch (e) {
                        console.error('Error parsing transit item:', item);
                        return null; // Return null if parsing fails
                    }
                }).filter(item => item !== null); // Remove invalid items (null)
            }

            if (!trackingCode || !status || !estimateDate || !noOfPacking) {
                return res.status(200).json({ success: false, message: 'Tracking ID, Status,  No. of Packing & Estimate Date are required' });
            }

            // Convert status to number
            const statusNumber = parseInt(status);
            if (isNaN(statusNumber) || statusNumber < 1 || statusNumber > 5) {
                return res.status(200).json({ success: false, message: 'Invalid status value' });
            }
            const statusMap = {
                1: { key: 'intransit', status: 0, deliveryDateTime: '', transitData: [] },
                2: { key: 'pickup', status: 0, deliveryDateTime: '' },
                3: { key: 'outdelivery', status: 0, deliveryDateTime: '' },
                4: { key: 'delivered', status: 0, deliveryDateTime: '' },
                5: { key: 'cancelled', status: 0, deliveryDateTime: '' }
            };

            statusMap[status].status = 1;
            statusMap[status].deliveryDateTime = deliveryDate;


            if (status == 1 && Array.isArray(transitTracking) && transitTracking.length > 0)
                statusMap[1].transitData = parsedTransitTracking[0];

            const newTracking = new Tracking({
                trackingId: trackingCode,
                status: statusNumber,
                estimateDate: moment(estimateDate).toDate(), // Convert string to Date object using moment for consistency
                pickUpLocation: pickUpLocation || null,
                dropLocation: dropLocation || null,
                transportMode: transportMode || null,
                noOfPacking: parseInt(noOfPacking),
                createdAt: new Date(),// Add createdAt timestamp on creation,
                deliveryStatus: statusMap
            });

            await newTracking.save();
            res.status(201).json({ success: true, message: 'Tracking added successfully', data: newTracking });
        });
    } catch (err) {
        console.error('Error adding tracking:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

const getTrackingById = async (req, res) => {
    try {
        const tracking = await Tracking.findById(req.params.id);
        if (!tracking) {
            return res.status(404).json({ message: 'Tracking not found' });
        }
        res.json(tracking);
    } catch (error) {
        console.error('Error fetching tracking by ID:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const updateTracking = async (req, res) => {


    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(400).json({ error: "Failed to parse form data" }); // Changed status code to 400 for bad request
            }
            const { id } = req.params;



            const trackingCode = fields.trackingCode ? fields.trackingCode[0] : '';
            const status = fields.status ? parseInt(fields.status[0]) : null;
            const pickUpLocation = fields.pickUpLocation ? fields.pickUpLocation[0] : '';
            const dropLocation = fields.dropLocation ? fields.dropLocation[0] : '';
            const transportMode = fields.transportMode ? fields.transportMode[0] : '';
            const noOfPacking = fields.noOfPacking ? fields.noOfPacking[0] : '';
            const deliveryDate = fields.deliveryDate ? fields.deliveryDate[0] : '';
            const estimateDate = fields.estimateDate ? fields.estimateDate[0] : '';
            const transitTracking = fields.transitData ? fields.transitData : []; // not [0] if you want full array



            let parsedTransitTracking = [];
            if (transitTracking.length > 0) {
                parsedTransitTracking = transitTracking.map(item => {
                    try {
                        return JSON.parse(item); // Parse each item into an object
                    } catch (e) {
                        console.error('Error parsing transit item:', item);
                        return null; // Return null if parsing fails
                    }
                }).filter(item => item !== null); // Remove invalid items (null)
            }

            const file = files.pod ? files.pod[0] : null;

            if (!trackingCode || pickUpLocation === null || status === null || dropLocation === null || transportMode === null || noOfPacking === null) { // Corrected the validation for bannerType and status
                return res.status(400).json({ error: "Tracking Code, status , PickUpLocation , dropLocation , transportMode & noOfPacking are required" });
            }

            const existingTrack = await Tracking.findById(id);
            if (!existingTrack) {
                return res.status(404).json({ success: false, message: 'Track not found' });
            }
            let imageUrl = existingTrack.pod; // Default to existing image
            if (file) {
                const result = await uploadImage(file);
                imageUrl = result.success ? result.url : imageUrl;
            }


            const existingTrackk = await Tracking.findById(id);

            if (!existingTrackk) {
                return res.status(404).json({ success: false, message: 'Track not found' });
            }

            // Clone current deliveryStatus
            const updatedDeliveryStatus = { ...existingTrackk.deliveryStatus };

            // Loop through the keys (as strings)
            for (let i = 1; i <= 5; i++) {
                const key = i;

                if (key <= status) {
                    updatedDeliveryStatus[key].status = 1;
                    if (updatedDeliveryStatus[key].deliveryDateTime === '') {
                        updatedDeliveryStatus[key].deliveryDateTime = deliveryDate;
                    }
                    if (deliveryDate) {
                        updatedDeliveryStatus[status].deliveryDateTime = deliveryDate;
                    }
                } else {
                    updatedDeliveryStatus[key].status = 0;
                    updatedDeliveryStatus[key].deliveryDateTime = '';
                }
            }

            if (status == 1 && Array.isArray(transitTracking) && transitTracking.length > 0)
                updatedDeliveryStatus[1].transitData = parsedTransitTracking[0];

            const updatedTracking = await Tracking.findByIdAndUpdate(
                id,
                {
                    trackingId: trackingCode,
                    status: parseInt(status), //currentstatus
                    estimateDate,
                    pickUpLocation,
                    dropLocation,
                    transportMode,
                    noOfPacking: parseInt(noOfPacking),
                    pod: imageUrl,
                    deliveryStatus: updatedDeliveryStatus // ✅ save the updated object
                },
                { new: true } // Return the updated document
            );

            if (!updatedTracking) {
                return res.status(404).json({ message: 'Tracking not found' });
            }

            await Tracking.findByIdAndUpdate(id, updatedTracking);


            res.json({ message: 'Tracking updated successfully', data: updatedTracking });
        });
    } catch (error) {
        console.error('Error updating tracking:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }

};


const deleteTracking = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTracking = await Tracking.findByIdAndDelete(id);

        if (!deletedTracking) {
            return res.status(404).json({ message: 'Tracking not found' });
        }

        res.json({ message: 'Tracking deleted successfully' });

    } catch (error) {
        console.error('Error deleting tracking:', error);
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
    trackingPage,
    trackingList,
    addTracking,
    getTrackingById,
    updateTracking,
    deleteTracking,
    downloadTrackingCsv
};