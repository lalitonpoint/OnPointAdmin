const Banner = require('../../models/websiteManagement/bannerModel'); // Import Banner model
const { uploadImage } = require("../../utils/uploadHelper"); // Import helper for file upload
const multiparty = require('multiparty');
const moment = require('moment'); // For date manipulation

// Banner page render (GET request for banner page)
const bannerPage = (req, res) => {
    res.render('pages/websiteManagement/banner'); // Renders the banner page
}

// Banner list (POST request to fetch the list of banners with pagination and search)
const bannerList = async (req, res) => {
    try {
        const { start, length, search, order, columns } = req.body;
        const searchValue = search?.value;
        let query = {};
        let sort = {};

        // Custom search parameters sent from the frontend
        const bannerTitleSearch = req.body.bannerTitle;
        const bannerTypeSearch = req.body.bannerType;
        const statusSearch = req.body.status;
        const createdAtSearch = req.body.createdAt;

        if (searchValue) {
            query.$or = [
                { title: new RegExp(searchValue, 'i') },
                { bannerType: new RegExp(searchValue, 'i') }, // Searching by number might not be effective
                { status: new RegExp(searchValue, 'i') } // Searching by number might not be effective
            ];
        } else {
            if (bannerTitleSearch) {
                query.title = new RegExp(bannerTitleSearch, 'i');
            }
            if (bannerTypeSearch) {
                query.bannerType = parseInt(bannerTypeSearch);
            }
            if (statusSearch) {
                query.status = parseInt(statusSearch);
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

            switch (parseInt(columnIndex)) {
                case 1: // Banner Title column
                    sort.title = sortDirection;
                    break;
                case 4: // Status column
                    sort.status = sortDirection;
                    break;
                case 5: // Created At column
                    sort.createdAt = sortDirection;
                    break;
                default:
                    sort.createdAt = -1; // Default sort by creation date descending
                    break;
            }
        } else {
            sort.createdAt = -1; // Default sort by creation date descending
        }

        const banners = await Banner.find(query)
            .skip(Number(start))
            .limit(Number(length))
            .sort(sort);

        const totalRecords = await Banner.countDocuments();
        const filteredRecords = await Banner.countDocuments(query);

        res.json({
            draw: req.body.draw,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: banners
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Save or update banner (POST request to save banner data along with the file)
const saveBanner = async (req, res) => {
    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(400).json({ error: "Failed to parse form data" }); // Changed status code to 400 for bad request
            }

            const bannerTitle = fields.bannerTitle ? fields.bannerTitle[0] : '';
            const bannerType = fields.bannerType ? parseInt(fields.bannerType[0]) : null;
            const status = fields.status ? parseInt(fields.status[0]) : 1; // Default to Active
            const file = files.bannerFile ? files.bannerFile[0] : null;

            if (!bannerTitle || bannerType === null || status === null) { // Corrected the validation for bannerType and status
                return res.status(400).json({ error: "Title, status & banner type are required" });
            }

            let bannerFileUrl = null;
            if (file) {
                const result = await uploadImage(file);
                if (result.success) {
                    bannerFileUrl = result.url;
                } else {
                    console.error("Error uploading image:", result.error || result.message);
                    return res.status(500).json({ error: "Failed to upload banner image" }); // Return error if image upload fails
                }
            } else {
                bannerFileUrl = ''; // Or handle the case where no file is uploaded based on your requirements
            }

            // console.log('Banner');
            const banner = new Banner({
                title: bannerTitle,
                bannerType,
                bannerFile: bannerFileUrl,
                status
            });
            await banner.save();

            res.status(201).json({ success: true, message: 'Banner saved successfully' }); // Changed status code to 201 for successful creation
        });
    } catch (error) {
        console.error("Error saving Banner:", error);
        res.status(500).json({ error: error.message });
    }
};
const updatedBanner = async (req, res) => {
    try {
        // const form = new multiparty.Form();
        const form = new multiparty.Form({
            maxFilesSize: 100 * 1024 * 1024, // 50 MB
        });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(400).json({ error: "Failed to parse form data" }); // Changed status code to 400
            }
            const bannerTitle = fields.bannerTitle ? fields.bannerTitle[0] : '';
            const bannerType = fields.bannerType ? parseInt(fields.bannerType[0]) : null;
            const status = fields.status ? parseInt(fields.status[0]) : 1; // Default to Active

            const { id } = req.params;

            const existingBanner = await Banner.findById(id);
            if (!existingBanner) {
                return res.status(404).json({ success: false, message: 'Banner not found' }); // Corrected message
            }

            if (!bannerTitle || bannerType === null || status === null) { // Added input validation
                return res.status(400).json({ error: "Title, status & banner type are required" });
            }

            let bannerFileUrl = existingBanner.bannerFile; // Default to existing bannerFile


            const file = files.bannerFile ? files.bannerFile[0] : null; // Assuming the field name is 'bannerFile'

            if (file) {
                const result = await uploadImage(file);
                imageUrl = result.success ? result.url : bannerFileUrl;
            }

            const updateData = {
                title: bannerTitle,
                bannerType,
                bannerFile: imageUrl,
                status,
                updatedAt: new Date(),
            };

            await Banner.findByIdAndUpdate(id, updateData); // Corrected model name to Banner
            res.json({ success: true, message: 'Banner updated successfully' });
        });
    } catch (error) {
        console.error('Error updating banner:', error); // Corrected log message
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get banner by ID
const getBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ message: 'Banner not found' });
        }
        res.json(banner);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching banner', details: error.message });
    }
};

// Delete banner by ID
const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        await Banner.findByIdAndDelete(id);
        res.json({ success: true, message: 'Banner deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Change banner status
const changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status === undefined || status === null) {
            return res.status(400).json({ error: 'Status value is required in the request body.' });
        }

        const updatedBanner = await Banner.findByIdAndUpdate(id, { status: parseInt(status) }, { new: true });

        if (!updatedBanner) {
            return res.status(404).json({ success: false, message: 'Banner not found.' });
        }

        res.json({ success: true, message: 'Banner status updated successfully', data: updatedBanner });
    } catch (error) {
        console.error('Error updating banner status:', error);
        res.status(500).json({ message: error.message });
    }
};

// Download all banners as CSV
const downloadAllCsv = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ createdAt: -1 });

        if (banners.length === 0) {
            return res.status(200).send("No banners to download.");
        }

        const headers = [
            "Banner Title",
            "Banner Type",
            "Status",
            "Created At"
        ];

        const csvRows = banners.map(banner => [
            `"${banner.title.replace(/"/g, '""')}"`,
            banner.bannerType === 1 ? "Image" : (banner.bannerType === 2 ? "Video" : ""),
            banner.status === 1 ? "Active" : "Inactive",
            moment(banner.createdAt).format('YYYY-MM-DD HH:mm:ss')
        ].join(","));

        const csvData = [headers.join(","), ...csvRows].join("\n");

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="banners.csv"');

        res.status(200).send(csvData);

    } catch (error) {
        console.error("Error downloading all banners as CSV:", error);
        res.status(500).send("Error downloading CSV file.");
    }
};

module.exports = {
    bannerPage,
    bannerList,
    saveBanner,
    getBanner,
    deleteBanner,
    changeStatus,
    downloadAllCsv,
    updatedBanner
};