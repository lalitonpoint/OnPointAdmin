const Banner = require('../../models/websiteManagement/bannerModel'); // Import Banner model
const { uploadImage } = require("../../utils/uploadHelper"); // Import helper for file upload
const multiparty = require('multiparty');
// Banner page render (GET request for banner page)
const bannerPage = (req, res) => {
    res.render('pages/websiteManagement/banner'); // Renders the banner page
}

// Banner list (GET request to fetch the list of banners with pagination and search)
const bannerList = async (req, res) => {
    try {
        let search = req.body.search?.value || ''; // Search query
        let start = parseInt(req.body.start) || 0; // Pagination start
        let length = parseInt(req.body.length) || 10; // Pagination length

        let query = {}; // Initialize an empty query object

        // If there is a search term, apply the search to the query
        if (search) {
            query = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },  // Search by title (case-insensitive)
                    { type: { $regex: search, $options: 'i' } },  // Search by type (case-insensitive)
                    { status: { $regex: search, $options: 'i' } } // Search by status (case-insensitive)
                ]
            };
        }

        // Count the total records and filtered records (if search is applied)
        let totalRecords = await Banner.countDocuments();
        let filteredRecords = await Banner.countDocuments(query);

        // Fetch the banners from the database based on pagination and search
        let banners = await Banner.find(query).skip(start).limit(length);

        // Return the response in the correct format for DataTables (or similar)
        res.json({
            draw: req.body.draw,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: banners // Must be an array of banner objects matching the columns
        });

    } catch (err) {
        console.error("Error fetching banners:", err);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

// Save or update banner (POST request to save banner data along with the image)const multiparty = require('multiparty');
const saveBanner = async (req, res) => {
    try {
        const form = new multiparty.Form();

        // Parse the form data
        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(500).json({ error: "Failed to parse form data" });
            }

            const title = fields.title ? fields.title[0] : '';
            const status = fields.status ? fields.status[0] : '';
            const type = fields.type ? fields.type[0] : '';
            const image = fields.image ? fields.image[0] : ''; // This should match the field name in the form

            if (!title || !status || !type) {
                return res.status(400).json({ error: "Title, status, and type are required" });
            }

            const file = files.image ? files.image[0] : null;
            if (!file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            if (!file || !file.path || !file.originalFilename) {
                return res.status(400).json({ error: "File data is incomplete" });
            }

            const result = await uploadImage(file);

            const imageUrl = result.success ? result.url : `http://localhost:${process.env.PORT || 3000}${result.path}`;

            const banner = new Banner({ title, status, type, image: imageUrl });
            await banner.save();

            res.json({ success: true, message: 'Banner saved successfully' });
        });

    } catch (error) {
        console.error("Error saving banner:", error);
        res.status(500).json({ error: error.message });
    }
};


module.exports = { saveBanner };


module.exports = { bannerPage, bannerList, saveBanner };
