const Faq = require('../../models/faqManagement/faqModel');
const moment = require('moment');

// Render the Faq management page
const faqPage = (req, res) => {
    res.render('pages/faqManagement/faq');
};

// Fetch list of faq (for DataTable)
const faqList = async (req, res) => {
    try {
        const { start, length, search, order } = req.body;
        const searchValue = search?.value;
        let query = {};
        let sort = {};

        // Custom search filters
        const titleSearch = req.body.title;
        const statusSearch = req.body.status;
        const createdAtSearch = req.body.createdAt;

        if (searchValue) {
            query.$or = [
                { title: new RegExp(searchValue, 'i') },
                { description: new RegExp(searchValue, 'i') }
            ];
        } else {
            if (titleSearch) query.title = new RegExp(titleSearch, 'i');
            if (statusSearch) query.status = statusSearch;
            if (createdAtSearch) {
                const startDate = moment(createdAtSearch).startOf('day');
                const endDate = moment(createdAtSearch).endOf('day');
                query.createdAt = { $gte: startDate.toDate(), $lte: endDate.toDate() };
            }
        }

        // Sorting
        if (order && order.length > 0) {
            const columnIndex = order[0].column;
            const sortDirection = order[0].dir === 'asc' ? 1 : -1;
            switch (parseInt(columnIndex)) {
                case 1: sort.title = sortDirection; break;
                case 3: sort.status = sortDirection; break;
                case 4: sort.createdAt = sortDirection; break;
                default: sort.createdAt = -1; break;
            }
        } else {
            sort.createdAt = -1;
        }

        const faq = await Faq.find(query).skip(Number(start)).limit(Number(length)).sort(sort);
        const totalRecords = await Faq.countDocuments();
        const filteredRecords = await Faq.countDocuments(query);

        res.json({
            draw: req.body.draw,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: faq
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create FAQ
const faqCreate = async (req, res) => {
    try {
        const { title, description, status } = req.body;

        if (!title || !status || !description) {
            return res.status(400).json({ error: "Title, status, and description are required" });
        }

        const saveFaq = new Faq({ title, description, status });
        await saveFaq.save();
        res.json({ success: true, message: 'Faq saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get specific FAQ
const getFaq = async (req, res) => {
    try {
        const faq = await Faq.findById(req.params.id);
        if (!faq) return res.status(404).json({ message: 'Faq not found' });
        res.json(faq);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching Faq', details: error.message });
    }
};

// Update FAQ
const updateFaq = async (req, res) => {
    try {
        const { title, description, status } = req.body;
        const { id } = req.params;

        if (!title || !status || !description) {
            return res.status(400).json({ error: "Title, status, and description are required" });
        }

        const updateData = { title, description, status, updatedAt: new Date() };
        await Faq.findByIdAndUpdate(id, updateData);
        res.json({ success: true, message: 'Faq updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete FAQ
const deleteFaq = async (req, res) => {
    try {
        const { id } = req.params;
        await Faq.findByIdAndDelete(id);
        res.json({ success: true, message: 'Faq deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Change Status
const changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status === undefined || status === null) {
            return res.status(400).json({ error: 'Status value is required' });
        }

        const faqData = await Faq.findByIdAndUpdate(id, { status }, { new: true });

        if (!faqData) {
            return res.status(404).json({ success: false, message: 'Faq not found.' });
        }

        res.json({ success: true, message: 'Faq status updated successfully', data: faqData });
    } catch (error) {
        if (error.code === 11000)
            res.json({ success: false, message: 'Duplicate Value Found' });
        else
            res.status(500).json({ message: error.message });
    }
};

module.exports = {
    faqPage,
    faqList,
    faqCreate,
    getFaq,
    updateFaq,
    deleteFaq,
    changeStatus
};
