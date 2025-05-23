const Tracking = require('../../models/websiteManagement/trackingModel');
const fs = require('fs');
const moment = require('moment'); // Ensure moment.js is installed: npm install moment
const csv = require('csv-parser');
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
            const clientName = fields.clientName ? fields.clientName[0] : '';
            const status = fields.status ? parseInt(fields.status[0]) : null;
            const pickUpLocation = fields.pickUpLocation ? fields.pickUpLocation[0] : ''; // Default to Active
            const dropLocation = fields.dropLocation ? fields.dropLocation[0] : ''; // Default to Active
            const transportMode = fields.transportMode ? fields.transportMode[0] : ''; // Default to Active
            const noOfPacking = fields.noOfPacking ? parseInt(fields.noOfPacking[0]) : 1; // Default to Active
            const deliveryDate = fields.deliveryDate ? fields.deliveryDate[0] : ''; // Default to Active
            const estimateDate = fields.estimateDate ? fields.estimateDate[0] : ''; // Default to Active
            const transitTracking = fields.transitData ? fields.transitData : []; // not [0] if you want full array


            const consigneeName = fields.consigneeName ? fields.consigneeName[0] : '';
            const mobile = fields.mobile ? fields.mobile[0] : '';
            const consignorPincode = fields.consignorPincode ? fields.consignorPincode[0] : '';
            // const lrNo = fields.lrNo ? fields.lrNo[0] : '';
            const referenceNo = fields.referenceNo ? fields.referenceNo[0] : '';
            const invoiceNumber = fields.invoiceNumber ? fields.invoiceNumber[0] : '';
            const invoiceValue = fields.invoiceValue ? parseFloat(fields.invoiceValue[0]) : 0;
            const boxes = fields.boxes ? parseInt(fields.boxes[0]) : 0;
            const ewayBillNo = fields.ewayBillNo ? fields.ewayBillNo[0] : '';
            const invoiceDate = fields.invoiceDate ? new Date(fields.invoiceDate[0]) : null;
            const connectionPartner = fields.connectionPartner ? fields.connectionPartner[0] : '';
            const partnerCnNumber = fields.partnerCnNumber ? fields.partnerCnNumber[0] : '';
            const actualWeight = fields.actualWeight ? parseFloat(fields.actualWeight[0]) : 0;
            const chargedWeight = fields.chargedWeight ? parseFloat(fields.chargedWeight[0]) : 0;
            const connectionDate = fields.connectionDate ? new Date(fields.connectionDate[0]) : null;
            const tat = fields.tat ? fields.tat[0] : '';
            const edd = fields.edd ? fields.edd[0] : '';
            const add = fields.add ? fields.add[0] : '';
            const remarks = fields.remarks ? fields.remarks[0] : '';

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
                1: { key: 'pickup', status: 0, deliveryDateTime: '' },
                2: { key: 'intransit', status: 0, deliveryDateTime: '', transitData: [] },
                3: { key: 'outdelivery', status: 0, deliveryDateTime: '' },
                4: { key: 'delivered', status: 0, deliveryDateTime: '' },
                5: { key: 'cancelled', status: 0, deliveryDateTime: '' }
            };

            statusMap[status].status = 1;
            statusMap[status].deliveryDateTime = deliveryDate;


            if (status == 2 && Array.isArray(transitTracking) && transitTracking.length > 0)
                statusMap[2].transitData = parsedTransitTracking[0];

            const newTracking = new Tracking({
                trackingId: trackingCode,
                clientName,
                status: statusNumber,
                estimateDate: moment(estimateDate).toDate(), // Convert string to Date object using moment for consistency
                pickUpLocation: pickUpLocation || null,
                dropLocation: dropLocation || null,
                transportMode: transportMode || null,
                noOfPacking: parseInt(noOfPacking),
                createdAt: new Date(),// Add createdAt timestamp on creation,
                deliveryStatus: statusMap,

                consigneeName,
                mobile,
                consignorPincode,
                // lrNo,
                referenceNo,
                invoiceNumber,
                invoiceValue: parseFloat(invoiceValue) || 0,
                boxes: parseInt(boxes) || 0,
                ewayBillNo,
                invoiceDate: invoiceDate ? moment(invoiceDate).toDate() : null,
                connectionPartner,
                partnerCnNumber,
                actualWeight: parseFloat(actualWeight) || 0,
                chargedWeight: parseFloat(chargedWeight) || 0,
                connectionDate: connectionDate ? moment(connectionDate).toDate() : null,
                tat,
                edd,
                add,
                remarks,

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
            const clientName = fields.clientName ? fields.clientName[0] : '';
            const status = fields.status ? parseInt(fields.status[0]) : null;
            const pickUpLocation = fields.pickUpLocation ? fields.pickUpLocation[0] : '';
            const dropLocation = fields.dropLocation ? fields.dropLocation[0] : '';
            const transportMode = fields.transportMode ? fields.transportMode[0] : '';
            const noOfPacking = fields.noOfPacking ? fields.noOfPacking[0] : '';
            const deliveryDate = fields.deliveryDate ? fields.deliveryDate[0] : '';
            const estimateDate = fields.estimateDate ? fields.estimateDate[0] : '';
            const transitTracking = fields.transitData ? fields.transitData : []; // not [0] if you want full array


            const consigneeName = fields.consigneeName ? fields.consigneeName[0] : '';
            const mobile = fields.mobile ? fields.mobile[0] : '';
            const consignorPincode = fields.consignorPincode ? fields.consignorPincode[0] : '';
            // const lrNo = fields.lrNo ? fields.lrNo[0] : '';
            const referenceNo = fields.referenceNo ? fields.referenceNo[0] : '';
            const invoiceNumber = fields.invoiceNumber ? fields.invoiceNumber[0] : '';
            const invoiceValue = fields.invoiceValue ? parseFloat(fields.invoiceValue[0]) : 0;
            const boxes = fields.boxes ? parseInt(fields.boxes[0]) : 0;
            const ewayBillNo = fields.ewayBillNo ? fields.ewayBillNo[0] : '';
            const invoiceDate = fields.invoiceDate ? new Date(fields.invoiceDate[0]) : null;
            const connectionPartner = fields.connectionPartner ? fields.connectionPartner[0] : '';
            const partnerCnNumber = fields.partnerCnNumber ? fields.partnerCnNumber[0] : '';
            const actualWeight = fields.actualWeight ? parseFloat(fields.actualWeight[0]) : 0;
            const chargedWeight = fields.chargedWeight ? parseFloat(fields.chargedWeight[0]) : 0;
            const connectionDate = fields.connectionDate ? new Date(fields.connectionDate[0]) : null;
            const tat = fields.tat ? fields.tat[0] : '';
            const edd = fields.edd ? fields.edd[0] : '';
            const add = fields.add ? fields.add[0] : '';
            const remarks = fields.remarks ? fields.remarks[0] : '';



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

            if (status == 2 && Array.isArray(transitTracking) && transitTracking.length > 0)
                updatedDeliveryStatus[2].transitData = parsedTransitTracking[0];

            const updatedTracking = await Tracking.findByIdAndUpdate(
                id,
                {
                    trackingId: trackingCode,
                    clientName,
                    status: parseInt(status), //currentstatus
                    estimateDate,
                    pickUpLocation,
                    dropLocation,
                    transportMode,
                    noOfPacking: parseInt(noOfPacking),
                    pod: imageUrl,
                    deliveryStatus: updatedDeliveryStatus,// ✅ save the updated object

                    consigneeName,
                    mobile,
                    consignorPincode,
                    // lrNo,
                    referenceNo,
                    invoiceNumber,
                    invoiceValue: parseFloat(invoiceValue) || 0,
                    boxes: parseInt(boxes) || 0,
                    ewayBillNo,
                    invoiceDate: invoiceDate ? moment(invoiceDate).toDate() : null,
                    connectionPartner,
                    partnerCnNumber,
                    actualWeight: parseFloat(actualWeight) || 0,
                    chargedWeight: parseFloat(chargedWeight) || 0,
                    connectionDate: connectionDate ? moment(connectionDate).toDate() : null,
                    tat,
                    edd,
                    add,
                    remarks,
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
            "Created At",

            "Invoice Date",
            "Connection Date",
            "Consignee Name",
            "Mobile",
            "Consignor Pincode",
            // "LR No",
            "Reference No",
            "Invoice Number",
            "Invoice Value",
            "Boxes",
            "Eway Bill No",
            "Invoice Date",
            "Connection Partner",
            "Partner CN Number",
            "Actual Weight",
            "Charged Weight",
            "Connection Date",
            "TAT",
            "EDD",
            "ADD",
            "Remarks"
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
            moment(tracking.createdAt).format('YYYY-MM-DD HH:mm:ss'),

            tracking.invoiceDate || '',
            tracking.connectionDate || '',
            tracking.consigneeName || '',
            tracking.mobile || '',
            tracking.consignorPincode || '',
            // tracking.lrNo || '',
            tracking.referenceNo || '',
            tracking.invoiceNumber || '',
            tracking.invoiceValue || '',
            tracking.boxes || '',
            tracking.ewayBillNo || '',
            moment(tracking.invoiceDate).format('YYYY-MM-DD HH:mm:ss'),
            tracking.connectionPartner || '',
            tracking.partnerCnNumber || '',
            tracking.actualWeight || '',
            tracking.chargedWeight || '',
            moment(tracking.connectionDate).format('YYYY-MM-DD HH:mm:ss'),
            tracking.tat || '',
            tracking.edd || '',
            tracking.add || '',
            tracking.remarks || ''
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

const UploadCsv = async (req, res) => {
    try {
        const csvFile = req.file;
        if (!csvFile) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const filePath = csvFile.path;
        const results = [];
        const duplicates = [];
        const saved = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                results.push(row);
            })
            .on('end', async () => {
                for (const row of results) {
                    // console.log(row);
                    try {
                        const {
                            trackingId,
                            clientName,
                            status,
                            estimateDate,
                            pickUpLocation,
                            dropLocation,
                            transportMode,
                            noOfPacking,
                            pod,

                            consigneeName,
                            mobile,
                            consignorPincode,
                            // lrNo,
                            referenceNo,
                            invoiceNumber,
                            invoiceValue,
                            boxes,
                            ewayBillNo,
                            invoiceDate,
                            connectionPartner,
                            partnerCnNumber,
                            actualWeight,
                            chargedWeight,
                            connectionDate,
                            tat,
                            edd,
                            add,
                            remarks
                        } = row;

                        if (!trackingId) {
                            console.log("Skipping row due to missing trackingId");
                            continue;
                        }

                        const existing = await Tracking.findOne({ trackingId });
                        if (existing) {
                            console.log(`Tracking ID ${trackingId} already exists. Skipping.`);
                            duplicates.push({ trackingId, reason: 'Already exists' });
                            continue;
                        }

                        const statusNumber = parseInt(status);
                        const statusMap = {
                            1: { key: 'pickup', status: 0, deliveryDateTime: '', pod: '' },
                            2: { key: 'intransit', status: 0, deliveryDateTime: '', transitData: [], pod: '' },
                            3: { key: 'outdelivery', status: 0, deliveryDateTime: '', pod: '' },
                            4: { key: 'delivered', status: 0, deliveryDateTime: '', pod: '' },
                            5: { key: 'cancelled', status: 0, deliveryDateTime: '', pod: '' }
                        };

                        if (statusMap[statusNumber]) {
                            statusMap[statusNumber].status = 1;
                            statusMap[statusNumber].deliveryDateTime = new Date();
                            // Only set pod if Delivered
                            if (statusNumber === 4) {
                                statusMap[statusNumber].pod = pod;
                            }
                        }

                        const newTracking = new Tracking({
                            trackingId,
                            clientName,
                            status: statusNumber,
                            estimateDate: moment(estimateDate).toDate(),
                            pickUpLocation,
                            dropLocation,
                            transportMode,
                            noOfPacking: parseInt(noOfPacking),
                            pod: statusNumber === 4 ? pod : '', // Only save pod if status == 4
                            createdAt: new Date(),
                            deliveryStatus: statusMap,

                            consigneeName,
                            mobile,
                            consignorPincode,
                            // lrNo,
                            referenceNo,
                            invoiceNumber,
                            invoiceValue,
                            boxes,
                            ewayBillNo,
                            invoiceDate: invoiceDate ? moment(invoiceDate).toDate() : null,
                            connectionPartner,
                            partnerCnNumber,
                            actualWeight,
                            chargedWeight,
                            connectionDate: connectionDate ? moment(connectionDate).toDate() : null,
                            tat,
                            edd,
                            add,
                            remarks
                        });

                        await newTracking.save();
                        saved.push(trackingId);
                    } catch (err) {
                        console.error("Error saving row:", err.message);
                        duplicates.push({ trackingId: row.trackingId || 'Unknown', reason: err.message });
                    }
                }

                res.status(200).json({
                    success: true,
                    message: "CSV uploaded and processed.",
                    savedCount: saved.length,
                    duplicateCount: duplicates.length,
                    duplicates
                });
            })
            .on('error', (err) => {
                console.error("CSV parse error:", err.message);
                res.status(500).json({ success: false, message: 'CSV file processing error' });
            });
    } catch (err) {
        console.error("UploadCsv error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



module.exports = {
    trackingPage,
    trackingList,
    addTracking,
    getTrackingById,
    updateTracking,
    deleteTracking,
    downloadTrackingCsv,
    UploadCsv
};