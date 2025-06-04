const Warehouse = require('../../models/websiteManagement/warehouseModal');
const moment = require('moment'); // Ensure moment.js is installed: npm install moment
const multiparty = require('multiparty');
const { generateLogs } = require('../../utils/logsHelper');

const fs = require('fs');
const csv = require('csv-parser');



const warehousePage = (req, res) => {
    res.render('pages/websiteManagement/warehouse');
}

// Fetch warehouse data (for DataTable)const moment = require('moment');

const warehouseList = async (req, res) => {
    try {
        const { start = 0, length = 10, search, columns, order, draw, warehouseCode, status, date } = req.body;

        const searchValue = search?.value?.trim();
        let query = {};
        let sort = {};

        // Global Search
        if (searchValue) {
            query.$or = [
                { warehouseId: new RegExp(searchValue, 'i') },
                { status: new RegExp(searchValue, 'i') },
                // Add other searchable fields here
            ];
        } else {
            if (warehouseCode) {
                query.warehouseId = new RegExp(warehouseCode, 'i');
            }

            if (status !== undefined && status !== '') {
                query.status = parseInt(status);
            }

            if (date) {
                const searchMoment = moment(date, 'YYYY-MM-DD', true);
                if (searchMoment.isValid()) {
                    query.deliveryDate = {
                        $gte: searchMoment.clone().startOf('day').toDate(),
                        $lte: searchMoment.clone().endOf('day').toDate()
                    };
                }
            }
        }

        // Sorting
        if (order && order.length > 0) {
            const columnIndex = parseInt(order[0].column);
            const sortDirection = order[0].dir === 'asc' ? 1 : -1;

            switch (columnIndex) {
                case 5:
                    sort.noOfPacking = sortDirection;
                    break;
                case 7:
                    sort.deliveryDate = sortDirection;
                    break;
                default:
                    sort.createdAt = -1;
            }
        } else {
            sort.createdAt = -1;
        }

        // Fetch filtered and paginated data
        const [data, recordsFiltered, recordsTotal] = await Promise.all([
            Warehouse.find(query).skip(Number(start)).limit(Number(length)).sort(sort),
            Warehouse.countDocuments(query),
            Warehouse.countDocuments()
        ]);

        return res.json({
            draw: Number(draw),
            recordsTotal,
            recordsFiltered,
            data
        });

    } catch (error) {
        console.error('Error fetching warehouse list:', error);
        res.status(500).json({ error: 'Failed to fetch warehouse data' });
    }
};


const addWarehouse = async (req, res) => {
    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(400).json({ message: "Invalid form data" });
            }

            let pincode = fields.pincode?.[0]?.trim() || '';
            let statusStr = fields.status?.[0]?.trim() || '';
            let message = fields.message?.[0]?.trim() || '';

            // Validate fields
            if (!pincode || !statusStr || !message) {
                return res.status(400).json({
                    message: 'Warehouse Pincode, Status, and Message are required'
                });
            }

            const status = Number(statusStr);
            if (isNaN(status) || ![1, 2].includes(status)) {
                return res.status(400).json({
                    message: 'Status must be 1 (Active) or 2 (Inactive)'
                });
            }

            const newWarehouse = new Warehouse({ pincode, status, message });
            await newWarehouse.save();


            return res.status(201).json({
                message: 'Warehouse added successfully',
                data: newWarehouse
            });
        });

    } catch (err) {
        console.error('Error adding warehouse:', err);
        return res.status(500).json({
            message: 'Internal server error',
            error: err.message
        });
    }
};


const getwareHousebyId = async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            return res.status(404).json({ message: 'warehouse not found' });
        }
        res.json(warehouse);
    } catch (error) {
        console.error('Error fetching warehouse by ID:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
const updateWarehouse = async (req, res) => {
    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(400).json({ error: "Invalid form data" });
            }

            const { id } = req.params;
            const status = fields?.status?.[0];
            const pincode = fields?.pincode?.[0]?.trim();
            const message = fields?.message?.[0]?.trim();

            // Validate required fields
            if (!id || !status || !pincode || !message) {
                return res.status(400).json({ error: "Status, Pincode, and Message are required" });
            }

            // Check if warehouse exists
            const existingWarehouse = await Warehouse.findById(id);
            if (!existingWarehouse) {
                return res.status(404).json({ success: false, message: 'Warehouse not found' });
            }

            // Update the warehouse
            const updatedWarehouse = await Warehouse.findByIdAndUpdate(
                id,
                {
                    status: parseInt(status),
                    pincode,
                    message,
                },
                { new: true }
            );

            if (!updatedWarehouse) {
                return res.status(404).json({ success: false, message: 'Warehouse update failed' });
            }

            // Log the update
            await generateLogs(req, 'Edit', updatedWarehouse);

            return res.json({
                success: true,
                message: 'Warehouse updated successfully',
                data: updatedWarehouse
            });
        });
    } catch (error) {
        console.error('Error updating warehouse:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};


const deleteWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedwarehouse = await Warehouse.findByIdAndDelete(id);

        if (!deletedwarehouse) {
            return res.status(404).json({ message: 'warehouse not found' });
        }
        await generateLogs(req, 'Delete', deletedwarehouse);

        res.json({ message: 'warehouse deleted successfully' });

    } catch (error) {
        console.error('Error deleting warehouse:', error);
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
                    try {
                        let {
                            status = '',
                            pincode = '',
                            message = ''
                        } = row;


                        status = String(status).trim().toUpperCase();

                        status = status == 'ACTIVE' ? 1 : 2;


                        if (!pincode) {
                            duplicates.push({ pincode: 'N/A', reason: 'Missing pincode' });
                            continue;
                        }

                        const existing = await Warehouse.findOne({ pincode });
                        if (existing) {
                            console.log(`Pincode ${pincode} already exists. Skipping.`);
                            duplicates.push({ pincode, reason: 'Already exists' });
                            continue;
                        }

                        const newWarehouse = new Warehouse({
                            status,
                            pincode,
                            message
                        });

                        await newWarehouse.save();
                        saved.push(newWarehouse);
                    } catch (err) {
                        console.error("Error saving row:", err.message);
                        duplicates.push({ pincode: row.pincode || 'Unknown', reason: err.message });
                    }
                }

                // Optional: remove the uploaded file after processing
                fs.unlink(filePath, () => { });

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
    warehousePage,
    warehouseList,
    addWarehouse,
    getwareHousebyId,
    updateWarehouse,
    deleteWarehouse,
    downloadAllCsv,
    UploadCsv
};
