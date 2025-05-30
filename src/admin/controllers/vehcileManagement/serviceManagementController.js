const Service = require('../../models/vehcileManagement/serviceManagementModel');
const { uploadImage } = require("../../utils/uploadHelper"); // Import helper for file upload
const multiparty = require('multiparty');
const moment = require('moment'); // For date manipulation
const { generateLogs } = require('../../utils/logsHelper');


const servicePage = (req, res) => {
    res.render('pages/vehcileManagement/serviceManagement');
}

const serviceList = async (req, res) => {
    try {
        const { start, length, search, columns, order } = req.body;
        const searchValue = search?.value;
        let query = {};
        let sort = {};

        // Custom search parameters sent from the frontend
        const serviceNameSearch = req.body.serviceName;
        const statusSearch = req.body.status;
        const createdAtSearch = req.body.createdAt;

        if (searchValue) {
            query.$or = [
                { serviceName: new RegExp(searchValue, 'i') },
                // You can add more fields to the global search if needed, e.g., for serviceImage filename if you store it separately
            ];
        } else {
            if (serviceNameSearch) {
                query.serviceName = new RegExp(serviceNameSearch, 'i');
            }
            if (statusSearch) {
                if (statusSearch !== "") {
                    query.status = parseInt(statusSearch); // Ensure status is an integer for comparison
                }
            }
            else {
                query.status = { $in: [1, 2] };
            }
            if (createdAtSearch) {
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
                case 1: // Service Name column
                    sort.serviceName = sortDirection;
                    break;
                case 3: // Status column (index is 3 because 'Service Image' is at index 2)
                    sort.status = sortDirection;
                    break;
                case 4: // Created At column (Corrected index)
                    sort.createdAt = sortDirection;
                    break;
                default:
                    // Default sorting if no valid column is specified
                    sort.createdAt = -1;
                    break;
            }
        } else {
            // Default sorting if no order is specified
            sort.createdAt = -1;
        }

        const services = await Service.find(query)
            .skip(Number(start))
            .limit(Number(length))
            .sort(sort); // Apply the sort order

        const totalRecords = await Service.countDocuments({ status: { $in: [1, 2] } });
        const filteredRecords = await Service.countDocuments(query);

        res.json({
            draw: req.body.draw,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: services
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const saveService = async (req, res) => {
    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(500).json({ error: "Failed to parse form data" });
            }

            // Extract data from fields
            const serviceName = fields.serviceName ? fields.serviceName[0] : '';
            const status = fields.status ? fields.status[0] : '';

            // Validation for required fields
            if (!serviceName || !status) {
                return res.status(400).json({ error: "Service Name and Status are required" });
            }

            // Handle file upload
            const file = files.serviceImage ? files.serviceImage[0] : null;
            let imageUrl = '';

            if (file) {
                const result = await uploadImage(file);
                if (result.success) {
                    imageUrl = result.url;
                } else {
                    return res.status(500).json({ error: result.message });
                }
            } else if (!fields.serviceId) { // If it's a new service and no image is uploaded
                return res.status(400).json({ error: "Service Image is required for new services" });
            } else if (fields.serviceId) {
                // For edit, the image might not be updated. We'll handle fetching the old image later if needed.
            }


            const serviceData = {
                serviceName,
                status: parseInt(status), // Ensure status is an integer
            };

            if (imageUrl) {
                serviceData.serviceImage = imageUrl;
            }

            const serviceId = fields.serviceId ? fields.serviceId[0] : null;

            if (serviceId) {
                // Update existing service
                try {
                    const existingService = await Service.findById(serviceId);
                    if (!existingService) {
                        return res.status(404).json({ error: 'Service not found' });
                    }
                    Object.assign(existingService, serviceData);
                    await existingService.save();
                    res.json({ success: true, message: 'Service updated successfully' });
                } catch (updateError) {
                    console.error("Error updating service:", updateError);
                    res.status(500).json({ error: updateError.message });
                }
            } else {
                // Create a new Service document
                const service = new Service(serviceData);

                // Save the service to the database
                await service.save();
                await generateLogs(req, 'Add', service);

                // Return success response
                res.json({ success: true, message: 'Service saved successfully' });
            }
        });

    } catch (error) {
        console.error("Error saving service:", error);
        res.status(500).json({ error: error.message });
    }
};

// Edit service
const editService = async (req, res) => {
    try {
        const form = new multiparty.Form();

        // Parse the form data
        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(500).json({ error: "Failed to parse form data" });
            }

            const serviceName = fields.serviceName ? fields.serviceName[0] : '';
            const status = fields.status ? fields.status[0] : '';

            const { id } = req.params;

            const existingService = await Service.findById(id);
            if (!existingService) {
                return res.status(404).json({ success: false, message: 'Service not found' });
            }

            let imageUrl = existingService.serviceImage; // Default to existing image

            const file = files.serviceImage ? files.serviceImage[0] : null;

            if (file) {
                const result = await uploadImage(file);
                imageUrl = result.success ? result.url : imageUrl;
            }

            const updateData = {
                serviceName,
                status: parseInt(status), // Ensure status is an integer
                updatedAt: new Date(),
                serviceImage: imageUrl
            };

            await Service.findByIdAndUpdate(id, updateData);
            await generateLogs(req, 'Edit', updateData);

            res.json({ success: true, message: 'Service updated successfully' });
        });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
const mongoose = require('mongoose');

const deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findByIdAndUpdate(id, { status: 3 });

        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        await generateLogs(req, 'Delete', { id });

        res.json({ success: true, message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};


//Change Status
const changeServiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Expect the new status value in the request body

        if (status === undefined || status === null) {
            return res.status(400).json({ error: 'Status value is required in the request body.' });
        }

        const updatedService = await Service.findByIdAndUpdate(id, { status: parseInt(status) }, { new: true });

        if (!updatedService) {
            return res.status(404).json({ success: false, message: 'Service not found.' });
        }

        res.json({ success: true, message: 'Service status updated successfully', data: updatedService });
    } catch (error) {
        console.error('Error updating service status:', error);
        if (error.code === 11000)
            res.json({ success: false, message: 'Duplicate Value Found' });
        else
            res.status(500).json({ message: error.message });

    }
}

const getService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) return res.status(404).json({ message: 'Service not found' });
        res.json(service);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching service', details: error.message });
    }
};

const downloadAllServicesCsv = async (req, res) => {
    try {
        const services = await Service.find().sort({ createdAt: -1 }); // Fetch all services, sorted by creation date (optional)

        if (services.length === 0) {
            return res.status(200).send("No services to download.");
        }

        // Define CSV headers
        const headers = [
            "Service Name",
            "Status",
            "Created At"
        ];

        // Convert service data to CSV format
        const csvRows = services.map(service => [
            `"${service.serviceName.replace(/"/g, '""')}"`, // Escape double quotes
            service.status === 1 ? "Active" : "Inactive",
            moment(service.createdAt).format('YYYY-MM-DD HH:mm:ss')].join(","));

        // Combine headers and data rows
        const csvData = [headers.join(","), ...csvRows].join("\n");

        // Set response headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="services.csv"');

        // Send the CSV data as the response
        res.status(200).send(csvData);

    } catch (error) {
        console.error("Error downloading all services as CSV:", error);
        res.status(500).send("Error downloading CSV file.");
    }
};

module.exports = {
    servicePage,
    getService,
    saveService,
    editService,
    deleteService,
    serviceList,
    changeServiceStatus,
    downloadAllServicesCsv
};