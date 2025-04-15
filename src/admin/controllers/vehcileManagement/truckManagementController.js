
const Vehcile = require('../../models/vehcileManagement/truckManagementModel'); // Assuming you have a Vehicle model
const { uploadImage } = require("../../utils/uploadHelper"); // Import helper for file upload
const multiparty = require('multiparty');

const vechiclePage = (req, res) => {
    res.render('pages/vehcileManagement/truckManagement');
}

const saveVehicle = async (req, res) => {
    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(500).json({ error: "Failed to parse form data" });
            }

            const name = fields.name ? fields.name[0] : '';
            const status = fields.status ? fields.status[0] : ''; // Assuming 'gender' in form maps to 'status' in model

            if (!name) {
                return res.status(400).json({ error: "Truck Name is required" });
            }

            const file = files.vechileImage ? files.vechileImage[0] : null;
            let imageUrl = '';
            if (file && file.path && file.originalFilename) {
                const result = await uploadImage(file);
                imageUrl = result.success ? result.url : `http://localhost:${process.env.PORT || 3000}${result.path}`;
            }

            const vehicleData = {
                name,
                vechileImage: imageUrl
            };

            // Handle status
            if (status && ['active', 'inactive'].includes(status)) {
                vehicleData.status = status;
            } else {
                // You might want to return an error or set a default if status is invalid
                // For now, we'll rely on the schema default if an invalid value is sent
                console.warn(`Invalid status value received: ${status}`);
            }


            const vehicle = new Vehcile(vehicleData);

            await vehicle.save();

            res.status(201).json({ success: true, message: 'Vehicle added successfully' });
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const vehicleList = async (req, res) => {
    try {
        // 1. Extract DataTables parameters using destructuring and set default values
        const { draw, start = 0, length = 10, search, order, columns } = req.body;
        const searchValue = search?.value || '';

        // 2. Build the filter object for searching
        const filter = {};
        if (searchValue) {
            filter.$or = [
                { name: { $regex: searchValue, $options: 'i' } }, // Search by Truck Name
                { status: { $regex: searchValue, $options: 'i' } }, // Search by Status
                // You might not want to search by image URL, but if needed:
                // { profileImage: { $regex: searchValue, $options: 'i' } },
                // Add more fields to search if needed
            ];
        }

        // 3. Determine the sorting order
        const sort = {};
        if (order?.[0]?.column !== undefined && order?.[0]?.dir) {
            const orderColumnIndex = order[0].column;
            const orderDirection = order[0].dir;
            const columnName = columns[orderColumnIndex]?.data;
            if (columnName) {
                sort[columnName] = orderDirection === 'asc' ? 1 : -1;
            }
        } else {
            sort.createdAt = -1; // Default sort by creation date descending
        }

        // 4. Fetch total and filtered record counts
        const totalRecords = await Vehcile.countDocuments();
        const filteredRecords = await Vehcile.countDocuments(filter);

        // 5. Fetch the paginated and sorted Vehcile data
        const vehicles = await Vehcile.find(filter)
            .sort(sort)
            .skip(parseInt(start)) // Ensure start is an integer
            .limit(parseInt(length)); // Ensure length is an integer

        // 6. Construct the JSON response for DataTables
        res.json({
            draw: parseInt(draw),
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: vehicles // Array of vehicle objects matching your columns
        });

    } catch (err) {
        console.error("Error fetching vehicle list:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const singleVehcile = async (req, res) => {
    try {
        const vehicle = await Vehcile.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'vehicle not found' });
        }
        res.json({ success: true, vehicle });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    vechiclePage, saveVehicle, vehicleList, singleVehcile
}