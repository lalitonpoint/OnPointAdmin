const Tracking = require('../../../api/user/models/paymentModal');
const PTL = require('../../../api/user/models/paymentModal');
const Driver = require('../../../api/driver/modals/driverModal');
const Warehouse = require('../../models/warehouseManagemnet/warehouseModal');
const driverPackageAssign = require('../../models/ptlPackages/driverPackageAssignModel');
const { generateLogs } = require('../../utils/logsHelper');

// const Driver = require('../models/Driver');
const moment = require('moment'); // Ensure moment.js is installed: npm install moment
const multiparty = require('multiparty');
const { uploadImage } = require("../../utils/uploadHelper"); // Import helper for file upload


const trackingPage = (req, res) => {
    res.render('pages/ptlPackages/ptlManagement');
}

// Fetch tracking data (for DataTable)
const trackingList = async (req, res) => {
    try {
        const { start, length, search, columns, order } = req.body;
        const searchValue = search?.value;
        let query = {};
        let sort = {};

        const pickUpLocationSearch = req.body.pickUpLocation;
        const dropLocationSearch = req.body.dropAddress;
        const statusSearch = req.body.status;
        const dateSearch = req.body.date; // This corresponds to the frontend's searchDate

        if (searchValue) {
            query.$or = [
                { pickupAddress: new RegExp(searchValue, 'i') },
                { dropAddress: new RegExp(searchValue, 'i') },
                { status: new RegExp(searchValue, 'i') }
                // Add more fields to the global search if needed
            ];
        } else {
            if (pickUpLocationSearch) {
                query.pickupAddress = new RegExp(pickUpLocationSearch, 'i');
            }
            if (dropLocationSearch) {
                query.dropAddress = new RegExp(dropLocationSearch, 'i');
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
            .sort(sort) // Apply the sort order
            .populate({ path: 'userId', select: 'fullName' }); // 👈 join userName from User model



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

            const trackingCode = fields.trackingId ? fields.trackingId[0] : '';
            const status = fields.status ? parseInt(fields.status[0]) : null;
            const pickUpLocation = fields.pickUpLocation ? fields.pickUpLocation[0] : ''; // Default to Active
            const dropLocation = fields.dropLocation ? fields.dropLocation[0] : ''; // Default to Active
            const transportMode = fields.transportMode ? fields.transportMode[0] : ''; // Default to Active
            const noOfPacking = fields.noOfPacking ? parseInt(fields.noOfPacking[0]) : 1; // Default to Active
            const deliveryDate = fields.deliveryDate ? fields.deliveryDate[0] : ''; // Default to Active
            // const deliveryTime = fields.deliveryTime ? fields.deliveryTime[0] : ''; // Default to Active

            // console.log('trackingCode', trackingCode);
            // console.log('status', status);
            // console.log('pickUpLocation', pickUpLocation);
            // console.log('dropLocation', dropLocation);
            // console.log('trackingCode', trackingCode);
            // console.log('transportMode', transportMode);
            // console.log('noOfPacking', noOfPacking);
            // console.log('deliveryDate', deliveryDate);
            // console.log('deliveryTime', deliveryTime);
            if (!trackingCode || !status || !deliveryDate || !noOfPacking) {
                return res.status(400).json({ message: 'Tracking ID, Status, Delivery Date, No. of Packing, and Delivery Time are required' });
            }

            // Convert status to number
            const statusNumber = parseInt(status);
            if (isNaN(statusNumber) || statusNumber < 1 || statusNumber > 5) {
                return res.status(400).json({ message: 'Invalid status value' });
            }
            const statusMap = {
                1: { key: 'in_process', status: 0, deliveryDateTime: '' },
                2: { key: 'pickup', status: 0, deliveryDateTime: '' },
                3: { key: 'outdelivery', status: 0, deliveryDateTime: '' },
                4: { key: 'delivered', status: 0, deliveryDateTime: '' },
                5: { key: 'cancelled', status: 0, deliveryDateTime: '' }
            };
            statusMap[status].status = 1;
            statusMap[status].deliveryDateTime = new Date();
            // console.log(statusMap[status].status); // Output: 0

            // Create a new tracking entry
            const newTracking = new Tracking({
                trackingId: trackingCode,
                status: statusNumber,
                deliveryDate: moment(deliveryDate).toDate(), // Convert string to Date object using moment for consistency
                pickUpLocation: pickUpLocation || null,
                dropLocation: dropLocation || null,
                transportMode: transportMode || null,
                noOfPacking: parseInt(noOfPacking),
                // deliveryTime: deliveryTime,
                createdAt: new Date(),// Add createdAt timestamp on creation,
                deliveryStatus: statusMap
            });

            // Save the new tracking entry to the database
            await newTracking.save();
            await generateLogs(req, 'Add', newTracking);

            // Send success response with a more standard status code
            res.status(201).json({ message: 'Tracking added successfully', data: newTracking });
        });
    } catch (err) {
        console.error('Error adding tracking:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

const getPackageDetail = async (req, res) => {
    try {
        const packageDetail = await PTL.findById(req.params.id);
        console.log(packageDetail);
        if (!packageDetail) {
            return res.status(404).json({ message: 'PTL Order not found' });
        }

        // Send both tracking and drivers
        res.json({
            packageDetail,
        });

    } catch (error) {
        console.error('Error fetching tracking by ID:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const assignDriver = async (req, res) => {
    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(400).json({ error: "Failed to parse form data" });
            }

            // Extracting fields
            const driverId = fields.driver?.[0] || '';
            const assignType = parseInt(fields.assignType?.[0]) || null;
            const warehouseId = fields.warehouse?.[0] || '';
            const packageId = fields.packageId?.[0] || '';
            const userId = fields.userId?.[0] || '';

            // Validation
            if (!driverId || !assignType || !warehouseId || !packageId || !userId) {
                return res.status(400).json({ message: 'DriverId, AssignType, WarehouseId, PackageId & UserId are required' });
            }



            // Initialize pickup/drop fields
            let pickupPincode = '', pickupAddress = '', pickupLatitude = '', pickupLongitude = '';
            let dropPincode = '', dropAddress = '', dropLatitude = '', dropLongitude = '';

            const existingTracking = await driverPackageAssign.findOne({ packageId }).sort({ createdAt: -1 });
            const initiateOrderDetail = await PTL.findOne({ _id: packageId, userId });

            if (existingTracking) {
                // If already assigned, reuse previous drop as new pickup
                pickupPincode = existingTracking.dropPincode || '';
                pickupAddress = existingTracking.dropAddress || '';
                pickupLatitude = existingTracking.dropLatitude || '';
                pickupLongitude = existingTracking.dropLongitude || '';

            }
            else {

                if (initiateOrderDetail) {
                    pickupPincode = initiateOrderDetail.pickupPincode || '';
                    pickupAddress = initiateOrderDetail.pickupAddress || '';
                    pickupLatitude = initiateOrderDetail.pickupLatitude || '';
                    pickupLongitude = initiateOrderDetail.pickupLongitude || '';
                }
            }

            // If new assignment


            if (assignType === 1) {
                const warehouseDetail = await Warehouse.findById(warehouseId);
                if (warehouseDetail) {
                    dropPincode = warehouseDetail.pincode || '';
                    dropAddress = warehouseDetail.warehouseAddress || '';
                    dropLatitude = warehouseDetail.warehouseLatitude || '';
                    dropLongitude = warehouseDetail.warehouseLongitude || '';
                }
            } else {
                if (initiateOrderDetail) {
                    dropPincode = initiateOrderDetail.dropPincode || '';
                    dropAddress = initiateOrderDetail.dropAddress || '';
                    dropLatitude = initiateOrderDetail.dropLatitude || '';
                    dropLongitude = initiateOrderDetail.dropLongitude || '';
                }
            }

            const newTracking = new driverPackageAssign({
                packageId,
                driverId,
                warehouseId,
                userId,
                assignType,
                pickupPincode,
                pickupAddress,
                pickupLatitude,
                pickupLongitude,
                dropPincode,
                dropAddress,
                dropLatitude,
                dropLongitude
            });

            await newTracking.save();
            await generateLogs(req, 'Add', newTracking);

            return res.status(201).json({ message: 'Tracking added successfully', data: newTracking });
        });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


const deleteTracking = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTracking = await Tracking.findByIdAndDelete(id);

        if (!deletedTracking) {
            return res.status(404).json({ message: 'Tracking not found' });
        }

        await generateLogs(req, 'Delete', deletedTracking);

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



const getDriverWarehouseData = async (req, res) => {
    try {
        const id = req.params.id
        console.log('iddd', id)

        let latestAssignOrderDetail = await driverPackageAssign.findOne({ packageId: id }).sort({ createdAt: -1 });

        if (!latestAssignOrderDetail) {
            latestAssignOrderDetail = {};
        }
        const drivers = await Driver.find({ approvalStatus: 1 });
        const warehouse = await Warehouse.find(); // If you want to filter, add a query here

        res.json({
            latestAssignOrderDetail,
            drivers,
            warehouse
        });

    } catch (error) {
        console.error('Error fetching tracking by ID:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const orderAssignList = async (req, res) => {
    try {
        const { start, length, search, columns, order, packageId } = req.body;
        let query = {};
        let sort = {};

        // const packageId = '681063389107f6e6eb4a0a5b';
        const assignedOrderDetail = await driverPackageAssign.find({ packageId }) // ✅ fixed duplicate key
            .skip(Number(start))
            .limit(Number(length))
            .sort(sort)
            .populate({ path: 'userId', select: 'fullName' }) // ✅ separate populate call
            .populate({ path: 'driverId', select: 'personalInfo.name' }); // ✅ separate populate call

        assignedOrderDetail.forEach((singleAssign) => {
            const lastStatus = singleAssign.deliveryStatus?.[singleAssign.deliveryStatus.length - 1];
            const deliveryDate = lastStatus?.deliveryDateTime || null;

            singleAssign._doc.deliveryDate = deliveryDate;
        });



        const totalRecords = await driverPackageAssign.countDocuments();
        const filteredRecords = await driverPackageAssign.countDocuments(query);

        res.json({
            draw: req.body.draw,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: assignedOrderDetail
        });
    } catch (error) {
        console.error('Error fetching tracking list:', error);
        res.status(500).json({ error: 'Failed to fetch tracking data' });
    }
};

const updateOrderStatus = async (req, res) => {
    const { orderStatus, assignOrderId } = req.body;

    if (!orderStatus) {
        return res.json({ success: false, message: "Order Status is required" });
    }
    if (!assignOrderId) {
        return res.json({ success: false, message: "Assign Order is required" });
    }


    try {
        let orderAssignDetail = await driverPackageAssign.findOne({ _id: assignOrderId });

        if (!orderAssignDetail) {
            return res.json({ success: false, message: "Order Not Assigned" });
        }

        orderAssignDetail.status = orderStatus;

        await orderAssignDetail.save();

        res.json({ success: true, message: "Order status updated successfully" });

    } catch (error) {
        // Handle any errors that occur during the process
        console.error(error);
        res.status(500).json({ success: false, message: "An error occurred while updating the order status" });
    }
};


module.exports = {
    trackingPage,
    trackingList,
    addTracking,
    getPackageDetail,
    assignDriver,
    deleteTracking,
    downloadTrackingCsv,
    getDriverWarehouseData,
    orderAssignList,
    updateOrderStatus
};