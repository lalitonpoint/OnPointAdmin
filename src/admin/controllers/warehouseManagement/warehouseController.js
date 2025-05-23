const warehouse = require('../../models/warehouseManagemnet/warehouseModal');
const moment = require('moment'); // Ensure moment.js is installed: npm install moment
const multiparty = require('multiparty');
const { uploadImage } = require("../../utils/uploadHelper"); // Import helper for file upload

const { generateLogs } = require('../../utils/logsHelper');


const warehousePage = (req, res) => {
    res.render('pages/warehouseManagement/warehouse');
}


// Fetch tracking data (for DataTable)
const warehouseList = async (req, res) => {
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

        const tracking = await warehouse.find(query)
            .skip(Number(start))
            .limit(Number(length))
            .sort(sort); // Apply the sort order

        const totalRecords = await warehouse.countDocuments();
        const filteredRecords = await warehouse.countDocuments(query);

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


const addWarehouse = async (req, res) => {
    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(400).json({ error: "Invalid form data" });
            }

            const {
                Warehousename = [''],
                status = [''],
                warehouseLocation = [''],
                warehouseAddress = [''],
                warehouseLatitude = [''],
                warehouseLongitude = [''],
                pincode = [''],
                phone = ['']
            } = fields;

            const warehouseName = Warehousename[0].trim();
            const warehouseStatus = parseInt(status[0]);
            const location = warehouseLocation[0].trim();
            const address = warehouseAddress[0]?.trim() || null;
            const latitude = warehouseLatitude[0] || null;
            const longitude = warehouseLongitude[0] || null;
            const zip = pincode[0].trim();
            const contact = phone[0]?.trim() || null;

            // Basic validation
            if (!warehouseName || !warehouseStatus || !zip || !location) {
                return res.status(400).json({ message: 'Warehouse Name, Status, Pincode, and Location are required' });
            }

            if (isNaN(warehouseStatus) || ![1, 2].includes(warehouseStatus)) {
                return res.status(400).json({ message: 'Invalid status value' });
            }

            // Create new warehouse entry
            const newWarehouse = new warehouse({
                Warehousename: warehouseName,
                status: warehouseStatus,
                warehouseLocation: location,
                warehouseAddress: address,
                warehouseLatitude: latitude,
                warehouseLongitude: longitude,
                pincode: zip,
                phone: contact,
                createdAt: new Date()
            });

            await newWarehouse.save();
            await generateLogs(req, 'Add', newWarehouse);

            return res.status(201).json({ message: 'Warehouse added successfully', data: newWarehouse });
        });

    } catch (err) {
        console.error('Error adding warehouse:', err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};


const getwareHousebyId = async (req, res) => {
    try {
        const tracking = await warehouse.findById(req.params.id);
        if (!tracking) {
            return res.status(404).json({ message: 'Tracking not found' });
        }
        res.json(tracking);
    } catch (error) {
        console.error('Error fetching tracking by ID:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const updateWarehouse = async (req, res) => {


    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(400).json({ error: "Failed to parse form data" }); // Changed status code to 400 for bad request
            }
            const { id } = req.params;



            const Warehousename = fields.Warehousename ? fields.Warehousename[0] : '';
            const status = fields.status ? parseInt(fields.status[0]) : null;
            const warehouseLocation = fields.warehouseLocation ? fields.warehouseLocation[0] : '';
            const warehouseAddress = fields.warehouseAddress ? fields.warehouseAddress[0] : '';
            const pincode = fields.pincode ? fields.pincode[0] : '';
            const phone = fields.phone ? fields.phone[0] : '';
            const warehouseLatitude = fields.warehouseLatitude ? fields.warehouseLatitude[0] : '';
            const warehouseLongitude = fields.warehouseLongitude ? fields.warehouseLongitude[0] : '';
            // const deliveryDate = fields.deliveryDate ? fields.deliveryDate[0] : '';
            // const deliveryTime = fields.deliveryTime ? fields.deliveryTime[0] : '';
            // const file = files.pod ? files.pod[0] : null;


            if (!Warehousename || warehouseLocation === null || status === null || warehouseAddress === null || pincode === null || phone === null) { // Corrected the validation for bannerType and status
                return res.status(400).json({ error: "Tracking Code, status , PickUpLocation , dropLocation , transportMode & noOfPacking are required" });
            }

            const existingTrack = await warehouse.findById(id);
            if (!existingTrack) {
                return res.status(404).json({ success: false, message: 'Warehouse not found' });
            }
            // let imageUrl = existingTrack.pod; // Default to existing image
            // if (file) {
            //     const result = await uploadImage(file);
            //     imageUrl = result.success ? result.url : imageUrl;
            // }


            const existingTrackk = await warehouse.findById(id);

            if (!existingTrackk) {
                return res.status(404).json({ success: false, message: 'Warehouse not found' });
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

            const updatedTracking = await warehouse.findByIdAndUpdate(
                id,
                {
                    Warehousename: Warehousename,
                    status: parseInt(status), //currentstatus
                    warehouseLocation,
                    warehouseAddress,
                    warehouseLatitude,
                    warehouseLongitude,
                    pincode,
                    phone,
                    deliveryStatus: updatedDeliveryStatus // ✅ save the updated object
                },
                { new: true } // Return the updated document
            );

            if (!updatedTracking) {
                return res.status(404).json({ message: 'Tracking not found' });
            }

            await warehouse.findByIdAndUpdate(id, updatedTracking);
            await generateLogs(req, 'Edit', updatedTracking);



            res.json({ message: 'Tracking updated successfully', data: updatedTracking });
        });
    } catch (error) {
        console.error('Error updating tracking:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }

};


const deleteWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTracking = await warehouse.findByIdAndDelete(id);

        if (!deletedTracking) {
            return res.status(404).json({ message: 'warehouse not found' });
        }
        await generateLogs(req, 'Delete', deletedTracking);

        res.json({ message: 'Tracking deleted successfully' });

    } catch (error) {
        console.error('Error deleting tracking:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};


const downloadAllCsv = async (req, res) => {
    try {
        const warehouseData = await warehouse.find().sort({ createdAt: -1 });

        if (warehouseData.length === 0) {
            return res.status(200).send("No Data to download.");
        }

        const headers = [
            "Warehouse Name",
            "Contact No.",
            "Warehouse Address",
            "Warehouse Location",
            "Warehouse Latitude",
            "Warehouse Longitude",
            "Warehouse Pincode",
            "Status",
            "Created At"
        ];

        const csvRows = warehouseData.map(war => [
            `"${war.Warehousename?.replace(/"/g, '""') || ''}"`,
            war.phone || '',
            war.warehouseAddress || '',
            war.warehouseLocation || '',
            war.warehouseLatitude || '',
            war.warehouseLongitude || '',
            war.pincode || '',
            war.status === 1 ? "Active" : "Inactive",
            moment(war.createdAt).format('YYYY-MM-DD HH:mm:ss')
        ].join(","));

        const csvData = [headers.join(","), ...csvRows].join("\n");

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="Warehouse_list.csv"');

        res.status(200).send(csvData);
    } catch (error) {
        console.error("Error downloading all Warehouse as CSV:", error);
        res.status(500).send("Error downloading CSV file.");
    }
};


module.exports = {
    warehousePage,
    warehouseList,
    addWarehouse,
    getwareHousebyId,
    updateWarehouse,
    deleteWarehouse,
    downloadAllCsv
};
