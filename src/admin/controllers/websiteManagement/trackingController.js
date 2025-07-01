const Tracking = require('../../models/websiteManagement/trackingModel');
const fs = require('fs');
const moment = require('moment'); // Ensure moment.js is installed: npm install moment
const csv = require('csv-parser');
const multiparty = require('multiparty');
const { uploadImage } = require("../../utils/uploadHelper"); // Import helper for file upload
const statesCities = require('./states-cities.json');
const City = require('../../models/websiteManagement/cityModal');


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
                    // sort.noOfPacking = sortDirection;
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
            const consignerName = fields.consignerName ? fields.consignerName[0] : '';
            const status = fields.status ? parseInt(fields.status[0]) : null;
            const pickUpLocation = fields.pickUpLocation ? fields.pickUpLocation[0] : ''; // Default to Active
            const dropLocation = fields.dropLocation ? fields.dropLocation[0] : ''; // Default to Active
            const transportMode = fields.transportMode ? fields.transportMode[0] : ''; // Default to Active
            // const noOfPacking = fields.noOfPacking ? parseInt(fields.noOfPacking[0]) : 1; // Default to Active
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
            const invoiceDate = fields.invoiceDate ? fields.invoiceDate[0] : '';
            const connectionPartner = fields.connectionPartner ? fields.connectionPartner[0] : '';
            const partnerCnNumber = fields.partnerCnNumber ? fields.partnerCnNumber[0] : '';
            const actualWeight = fields.actualWeight ? parseFloat(fields.actualWeight[0]) : 0;
            const chargedWeight = fields.chargedWeight ? parseFloat(fields.chargedWeight[0]) : 0;
            const connectionDate = fields.connectionDate ? fields.connectionDate[0] : null;
            const tat = fields.tat ? fields.tat[0] : '';
            // const edd = fields.edd ? fields.edd[0] : '';
            const add = fields.add ? fields.add[0] : '';
            const remarks = fields.remarks ? fields.remarks[0] : '';

            const checkExistingTrackingCode = await Tracking.find({ 'trackingCode': trackingCode });

            if (!checkExistingTrackingCode) {
                return res.status(200).json({ success: false, message: 'Track Id Already Registered' });
            }
            console.log('Invoice Date -> ', invoiceDate)
            console.log('Estimate Date -> ', estimateDate)
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

            if (!trackingCode || !status) {
                return res.status(200).json({ success: false, message: 'Tracking ID, Status,  No. of Packing & Estimate Date are required' });
            }

            // Convert status to number
            const statusNumber = parseInt(status);
            if (isNaN(statusNumber) || statusNumber < 1 || statusNumber > 6) {
                return res.status(200).json({ success: false, message: 'Invalid status value' });
            }
            const statusMap = {
                1: { key: 'pickup', status: 0, deliveryDateTime: '' },
                2: { key: 'intransit', status: 0, deliveryDateTime: '', transitData: [] },
                3: { key: 'outdelivery', status: 0, deliveryDateTime: '' },
                4: { key: 'delivered', status: 0, deliveryDateTime: '' },
                5: { key: 'cancelled', status: 0, deliveryDateTime: '' },
                6: { key: 'hold', status: 0, deliveryDateTime: '' },
            };

            statusMap[status].status = 1;
            statusMap[status].deliveryDateTime = deliveryDate;


            if (status == 2 && Array.isArray(transitTracking) && transitTracking.length > 0)
                statusMap[2].transitData = parsedTransitTracking[0];

            const newTracking = new Tracking({
                trackingId: trackingCode,
                consignerName,
                status: statusNumber,
                estimateDate: estimateDate ? moment(estimateDate).toDate() : '', // Convert string to Date object using moment for consistency
                pickUpLocation: pickUpLocation || null,
                dropLocation: dropLocation || null,
                transportMode: transportMode || null,
                // noOfPacking: parseInt(noOfPacking),
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
                invoiceDate: invoiceDate ? moment(invoiceDate).toDate() : '',
                connectionPartner,
                partnerCnNumber,
                actualWeight: parseFloat(actualWeight) || 0,
                chargedWeight: parseFloat(chargedWeight) || 0,
                connectionDate: connectionDate ? moment(connectionDate).toDate() : null,
                tat,
                // edd,
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
            const consignerName = fields.consignerName ? fields.consignerName[0] : '';
            const status = fields.status ? parseInt(fields.status[0]) : null;
            const pickUpLocation = fields.pickUpLocation ? fields.pickUpLocation[0] : '';
            const dropLocation = fields.dropLocation ? fields.dropLocation[0] : '';
            const transportMode = fields.transportMode ? fields.transportMode[0] : '';
            // const noOfPacking = fields.noOfPacking ? fields.noOfPacking[0] : '';
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
            // const edd = fields.edd ? fields.edd[0] : '';
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

            if (!trackingCode || pickUpLocation === null || status === null || dropLocation === null || transportMode === null) { // Corrected the validation for bannerType and status
                return res.status(400).json({ error: "Tracking Code, status , PickUpLocation , dropLocation , transportMode  are required" });
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
            for (let i = 1; i <= 6; i++) {
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
                    consignerName,
                    status: parseInt(status), //currentstatus
                    estimateDate,
                    pickUpLocation,
                    dropLocation,
                    transportMode,
                    // noOfPacking: parseInt(noOfPacking),
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
                    // edd,
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

// const downloadTrackingCsv = async (req, res) => {
//     try {
//         const { trackingCode, status, date } = req.query;
//         let query = {};

//         if (trackingCode) {
//             query.trackingId = new RegExp(trackingCode, 'i');
//         }
//         if (status) {
//             query.status = parseInt(status);
//         }
//         if (date) {
//             const startDate = moment(date).startOf('day');
//             const endDate = moment(date).endOf('day');
//             query.estimateDate = {
//                 $gte: startDate.toDate(),
//                 $lte: endDate.toDate()
//             };
//         }

//         const trackings = await Tracking.find(query).sort({ createdAt: -1 });

//         if (trackings.length === 0) {
//             return res.status(200).send("No tracking data found for the current filters.");
//         }

//         const csvHeaders = [
//             "#",
//             "Tracking ID",
//             "Pickup Location",
//             "Drop Location",
//             "Transport Mode",
//             "Status",
//             "Delivery Date",
//             "Created At",

//             "Invoice Date",
//             "Connection Date",
//             "Consignee Name",
//             "Mobile",
//             "Consignor Pincode",
//             // "LR No",
//             "Reference No",
//             "Invoice Number",
//             "Invoice Value",
//             "Boxes",
//             "Eway Bill No",
//             "Connection Partner",
//             "Partner CN Number",
//             "Actual Weight",
//             "Charged Weight",
//             "TAT",
//             // "EDD",
//             "ADD",
//             "Remarks",
//             "Tracking Status",
//         ];

//         const csvData = trackings.map((tracking, index) => [
//             index + 1,
//             tracking.trackingId,
//             tracking.pickUpLocation || '',
//             tracking.dropLocation || '',
//             tracking.transportMode || '',
//             // tracking.noOfPacking,
//             getStatusText(tracking.status), // Assuming you have a function to convert status code to text
//             moment(tracking.deliveryDate).format('YYYY-MM-DD'),
//             moment(tracking.createdAt).format('YYYY-MM-DD'),
//             moment(tracking.invoiceDate).format('YYYY-MM-DD'),
//             moment(tracking.connectionDate).format('YYYY-MM-DD'),

//             tracking.consigneeName || '',
//             tracking.mobile || '',
//             tracking.consignorPincode || '',
//             // tracking.lrNo || '',
//             tracking.referenceNo || '',
//             tracking.invoiceNumber || '',
//             tracking.invoiceValue || '',
//             tracking.boxes || '',
//             tracking.ewayBillNo || '',
//             tracking.connectionPartner || '',
//             tracking.partnerCnNumber || '',
//             tracking.actualWeight || '',
//             tracking.chargedWeight || '',
//             tracking.tat || '',
//             // tracking.edd || '',
//             tracking.add || '',
//             tracking.remarks || '',
//             formatDeliveryStatus(tracking.deliveryStatus)
//         ]);

//         // Helper function to convert status code to text
//         function getStatusText(status) {
//             switch (status) {
//                 case 1: return 'Pickup';
//                 case 2: return 'In Transit';
//                 case 3: return 'Out For Delivery';
//                 case 4: return 'Delivered';
//                 case 5: return 'Cancelled';
//                 case 6: return 'Hold';
//                 default: return 'Unknown';
//             }
//         }

//         // Format the CSV data
//         const csvRows = [csvHeaders, ...csvData].map(row => row.join(',')).join('\n');

//         res.setHeader('Content-Type', 'text/csv');
//         res.setHeader('Content-Disposition', 'attachment; filename="tracking_data.csv"');
//         res.status(200).send(csvRows);

//     } catch (error) {
//         console.error('Error downloading tracking CSV:', error);
//         res.status(500).send("Error generating CSV file.");
//     }
// };

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
            "trackingId",
            "pickUpLocation",
            "dropLocation",
            "transportMode",
            "status",
            "deliveryDate",
            "consignerName",
            "estimateDate",
            "pod",
            "invoiceDate",
            "connectionDate",
            "consigneeName",
            "mobile",
            "consignorPincode",
            "referenceNo",
            "invoiceNumber",
            "invoiceValue",
            "boxes",
            "ewayBillNo",
            "connectionPartner",
            "partnerCnNumber",
            "actualWeight",
            "chargedWeight",
            "tat",
            "add",
            "remarks",
            "trackingStatus"
        ];

        const csvData = trackings.map(tracking =>
            csvHeaders.map(key => {
                let value = tracking[key];

                // Format date fields
                if (value instanceof Date) {
                    return moment(value).format('YYYY-MM-DD');
                }

                // Format trackingStatus
                if (key === 'trackingStatus') {
                    return trackingStatusToString(tracking.deliveryStatus);
                }
                if (key === 'status') {
                    return formatTrackingStatus(tracking.status);
                }

                // Handle undefined/null
                return value !== undefined ? String(value).replace(/"/g, '""') : '';
            })
        );


        const csvRows = [csvHeaders, ...csvData].map(row =>
            row.map(val => `"${val}"`).join(',')
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="tracking_data.csv"');
        res.status(200).send(csvRows);

    } catch (error) {
        console.error('Error downloading tracking CSV:', error);
        res.status(500).send("Error generating CSV file.");
    }
};


const checkAndInsertCity = async (cityName) => {
    if (!cityName) return;

    const trimmed = cityName.trim();
    const exists = await City.findOne({
        name: { $regex: `^${trimmed}$`, $options: 'i' }
    });

    if (!exists) {
        const newCity = new City({ name: trimmed });
        await newCity.save();
        console.log(`Inserted new city: ${trimmed}`);
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
                const cleanedRow = {};
                for (const key in row) {
                    cleanedRow[key.trim()] = typeof row[key] === 'string' ? row[key].trim() : row[key];
                }
                results.push(cleanedRow);
            })
            .on('end', async () => {
                for (const row of results) {
                    console.log('rt67890', row)
                    try {


                        let {
                            trackingId,
                            pickUpLocation,
                            dropLocation,
                            transportMode,
                            status,
                            deliveryDate,
                            consignerName,
                            estimateDate,
                            pod,
                            invoiceDate,
                            connectionDate,
                            consigneeName,
                            mobile,
                            consignorPincode,
                            referenceNo,
                            invoiceNumber,
                            invoiceValue,
                            boxes,
                            ewayBillNo,
                            connectionPartner,
                            partnerCnNumber,
                            actualWeight,
                            chargedWeight,
                            tat,
                            add,
                            remarks,
                            trackingStatus
                        } = row;


                        // ✅ Ensure pickup & drop cities exist
                        await Promise.all([
                            checkAndInsertCity(pickUpLocation),
                            checkAndInsertCity(dropLocation)
                        ]);

                        estimateDate = estimateDate.replace(/\s+/g, '');
                        invoiceDate = invoiceDate.replace(/\s+/g, '');
                        deliveryDate = deliveryDate.replace(/\s+/g, '');
                        connectionDate = connectionDate.replace(/\s+/g, '');


                        if (!trackingId) {
                            console.warn("Skipping row due to missing trackingId");
                            continue;
                        }

                        const trimmedTrackingId = trackingId.trim();
                        const existing = await Tracking.findOne({ trackingId: trimmedTrackingId });

                        // if (existing) {
                        //     if (trackingStatus) {
                        //         const modifiedStatus = trackingStatusFormat(trackingStatus);
                        //         await Tracking.updateOne(
                        //             { trackingId: trimmedTrackingId },
                        //             { $set: { deliveryStatus: modifiedStatus } }
                        //         );
                        //     }
                        //     duplicates.push({ trackingId: trimmedTrackingId, reason: 'Already exists' });
                        //     continue;
                        // }

                        if (existing) {
                            const updateFields = {};

                            // Format trackingStatus
                            if (trackingStatus) {
                                const modifiedStatus = trackingStatusFormat(trackingStatus);
                                if (JSON.stringify(existing.deliveryStatus) !== JSON.stringify(modifiedStatus)) {
                                    updateFields.deliveryStatus = modifiedStatus;
                                }
                            }

                            // Add more field comparisons as needed
                            if (existing.pickUpLocation !== pickUpLocation) updateFields.pickUpLocation = pickUpLocation;
                            if (existing.dropLocation !== dropLocation) updateFields.dropLocation = dropLocation;
                            if (existing.transportMode !== transportMode) updateFields.transportMode = transportMode;
                            if (existing.status !== statusMapping(status)) updateFields.status = statusMapping(status);
                            if (existing.consignerName !== consignerName) updateFields.consignerName = consignerName;
                            if (existing.consigneeName !== consigneeName) updateFields.consigneeName = consigneeName;
                            if (existing.mobile !== mobile) updateFields.mobile = mobile;
                            if (existing.consignorPincode !== consignorPincode) updateFields.consignorPincode = consignorPincode;
                            if (existing.referenceNo !== referenceNo) updateFields.referenceNo = referenceNo;
                            if (existing.invoiceNumber !== invoiceNumber) updateFields.invoiceNumber = invoiceNumber;
                            if (existing.invoiceValue !== invoiceValue) updateFields.invoiceValue = invoiceValue;
                            if (existing.boxes !== boxes) updateFields.boxes = boxes;
                            if (existing.ewayBillNo !== ewayBillNo) updateFields.ewayBillNo = ewayBillNo;
                            if (existing.connectionPartner !== connectionPartner) updateFields.connectionPartner = connectionPartner;
                            if (existing.partnerCnNumber !== partnerCnNumber) updateFields.partnerCnNumber = partnerCnNumber;
                            if (existing.actualWeight !== actualWeight) updateFields.actualWeight = actualWeight;
                            if (existing.chargedWeight !== chargedWeight) updateFields.chargedWeight = chargedWeight;
                            if (existing.tat !== tat) updateFields.tat = tat;
                            if (existing.add !== add) updateFields.add = add;
                            if (existing.remarks !== remarks) updateFields.remarks = remarks;

                            // Dates: convert both sides to string for accurate comparison
                            const formatDate = (date) => date ? moment(date).format("YYYY-MM-DD") : null;

                            if (formatDate(existing.deliveryDate) !== formatDate(deliveryDate)) updateFields.deliveryDate = deliveryDate;
                            if (formatDate(existing.estimateDate) !== formatDate(estimateDate)) updateFields.estimateDate = estimateDate;
                            if (formatDate(existing.invoiceDate) !== formatDate(invoiceDate)) updateFields.invoiceDate = invoiceDate;
                            if (formatDate(existing.connectionDate) !== formatDate(connectionDate)) updateFields.connectionDate = connectionDate;

                            // If at least one field changed, update
                            if (Object.keys(updateFields).length > 0) {
                                await Tracking.updateOne(
                                    { trackingId: trimmedTrackingId },
                                    { $set: updateFields }
                                );
                                duplicates.push({ trackingId: trimmedTrackingId, reason: 'Updated existing record' });
                            } else {
                                duplicates.push({ trackingId: trimmedTrackingId, reason: 'Already exists with same data' });
                            }

                            continue;
                        }




                        console.log('status', status)
                        const statusNumber = parseInt(status) || 0;
                        console.log('Delivery', statusNumber)

                        let deliveryStatus;

                        if (trackingStatus) {
                            deliveryStatus = trackingStatusFormat(trackingStatus);
                        } else {
                            deliveryStatus = {
                                1: { key: 'pickup', status: 0, deliveryDateTime: '', pod: '' },
                                2: { key: 'intransit', status: 0, deliveryDateTime: '', transitData: [], pod: '' },
                                3: { key: 'outdelivery', status: 0, deliveryDateTime: '', pod: '' },
                                4: { key: 'delivered', status: 0, deliveryDateTime: '', pod: '' },
                                5: { key: 'cancelled', status: 0, deliveryDateTime: '', pod: '' },
                                6: { key: 'hold', status: 0, deliveryDateTime: '', pod: '' }
                            };

                            if (deliveryStatus[statusNumber]) {
                                deliveryStatus[statusNumber].status = 1;
                                deliveryStatus[statusNumber].deliveryDateTime = new Date();
                                if (statusNumber === 4) {
                                    deliveryStatus[statusNumber].pod = pod || '';
                                }
                            }
                        }

                        const newTracking = new Tracking({
                            trackingId: trimmedTrackingId,
                            pickUpLocation,
                            dropLocation,
                            transportMode,
                            status: status ? statusMapping(status.replace(/\b\w/g, c => c.toUpperCase())) : '',
                            deliveryDate,
                            consignerName,
                            estimateDate: estimateDate ? moment(estimateDate, 'DD-MM-YYYY').toDate() : null,
                            pod: statusNumber === 4 ? pod : '',
                            invoiceDate: invoiceDate ? moment(invoiceDate, 'DD-MM-YYYY').toDate() : null,
                            connectionDate: connectionDate ? moment(connectionDate, 'DD-MM-YYYY').toDate() : null,
                            consigneeName,
                            mobile,
                            consignorPincode,
                            referenceNo,
                            invoiceNumber,
                            invoiceValue,
                            boxes,
                            ewayBillNo,
                            connectionPartner,
                            partnerCnNumber,
                            actualWeight,
                            chargedWeight,
                            tat,
                            add,
                            remarks,
                            deliveryStatus // ✅ final structured deliveryStatus
                        });

                        await newTracking.save();
                        console.log('newTracking', newTracking)
                        saved.push(trimmedTrackingId);
                    } catch (err) {
                        console.error(`Error saving trackingId ${row.trackingId || 'Unknown'}:`, err.message);
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

function formatTrackingStatus(status) {
    switch (status) {
        case 1: return 'Pickup';
        case 2: return 'In Transit';
        case 3: return 'Out For Delivery';
        case 4: return 'Delivered';
        case 5: return 'Cancelled';
        case 6: return 'Hold';
        default: return 'Unknown';
    }
}


function statusMapping(status) {
    switch (status) {
        case 'Pickup': return 1;
        case 'In Transit': return 2;
        case 'Out For Delivery': return 3;
        case 'Delivered': return 4;
        case 'Cancelled': return 5;
        case 'Hold': return 6;
        default: return 'Unknown';
    }
}

function trackingStatusToString(deliveryStatus) {
    if (!deliveryStatus || typeof deliveryStatus !== 'object') return '';

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.trim().split('-');
        return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    }

    const segments = [];
    const steps = Object.keys(deliveryStatus).sort((a, b) => Number(a) - Number(b));

    for (const step of steps) {
        const entry = deliveryStatus[step];
        const key = entry.key.toLowerCase();

        switch (key) {
            case 'pickup':
            case 'outdelivery':
            case 'delivered':
                segments.push(key);
                segments.push(formatDate(entry.deliveryDateTime));
                break;

            case 'intransit':
                segments.push('intransit');
                if (Array.isArray(entry.transitData)) {
                    const transitStr = entry.transitData.map(item => {
                        return `${item.city} : ${formatDate(item.date)}`;
                    }).join(' | ');
                    segments.push(transitStr);
                } else {
                    segments.push('');
                }
                break;

            case 'cancelled':
                segments.push('cancelled');
                break;
        }
    }

    return segments.join(' -> ');
}

// Convert trackingStatus string into JSON deliveryStatus
function trackingStatusFormat(trackingStatus) {
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const deliveryStatus = {};
    const segments = trackingStatus.split('->');
    let i = 0;
    let step = 1;

    while (i < segments.length) {
        const key = segments[i].trim().toLowerCase();

        switch (key) {
            case 'pickup':
                deliveryStatus[step++] = {
                    key: "pickup",
                    status: 1,
                    deliveryDateTime: formatDate(segments[i + 1])
                };
                i += 2;
                break;

            case 'intransit':
                const transitItems = (segments[i + 1] || '').split('|').map(item => {
                    const [city, date] = item.split(" : ");
                    return {
                        city: city?.trim() || '',
                        date: formatDate(date?.trim())
                    };
                });
                deliveryStatus[step++] = {
                    key: "intransit",
                    status: 1,
                    deliveryDateTime: '',
                    transitData: transitItems
                };
                i += 2;
                break;

            case 'outdelivery':
                deliveryStatus[step++] = {
                    key: "outdelivery",
                    status: 1,
                    deliveryDateTime: formatDate(segments[i + 1])
                };
                i += 2;
                break;

            case 'delivered':
                deliveryStatus[step++] = {
                    key: "delivered",
                    status: 1,
                    deliveryDateTime: formatDate(segments[i + 1])
                };
                i += 2;
                break;

            default:
                i++;
        }
    }

    deliveryStatus[step++] = {
        key: "cancelled",
        status: 0,
        deliveryDateTime: ""
    };

    return deliveryStatus;
}

function formatDeliveryStatus(deliveryStatus) {
    const parts = [];

    for (const key in deliveryStatus) {
        const entry = deliveryStatus[key];

        // Skip if not active
        if (entry.status !== 1) continue;

        const formattedKey = entry.key.charAt(0).toUpperCase() + entry.key.slice(1);

        // If Intransit and transitData is available
        if (
            entry.key === 'intransit' &&
            Array.isArray(entry.transitData) &&
            entry.transitData.length > 0
        ) {
            const transitParts = entry.transitData.map((t) => {
                const date = new Date(t.date);
                const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
                return `${t.city} - ${formattedDate}`;
            });

            parts.push(`${formattedKey} -> ${transitParts.join(' | ')}`);
        }
        // For others, just use deliveryDateTime
        else if (entry.deliveryDateTime) {
            const date = new Date(entry.deliveryDateTime);
            const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
            parts.push(`${formattedKey} -> ${formattedDate}`);
        }
    }

    return parts.join(' -> ');
}



const states = (req, res) => {
    res.json(Object.keys(statesCities));
};

const cities = (req, res) => {
    const state = req.query.state;
    res.json(statesCities[state] || []);
};


module.exports = {
    trackingPage,
    trackingList,
    addTracking,
    getTrackingById,
    updateTracking,
    deleteTracking,
    downloadTrackingCsv,
    UploadCsv, states, cities
};