const Contact = require('../../../api/web/models/contactUsModel');
const moment = require('moment'); // For date manipulation if needed

const contactUsPage = (req, res) => {
    res.render('pages/websiteManagement/contactUs');
}

const contactList = async (req, res) => {
    try {
        const { start, length, search, columns, order } = req.body;
        const searchValue = search?.value;
        let query = {};
        let sort = {};

        // Custom search parameters sent from the frontend
        const nameSearch = req.body.name;
        const emailSearch = req.body.email;
        const mobileSearch = req.body.mobile;
        const statusSearch = req.body.status;
        const typeOfServiceSearch = req.body.typeOfService;
        const createdAtSearch = req.body.createdAt; // Get the created at search value

        if (searchValue) {
            query.$or = [
                { name: new RegExp(searchValue, 'i') },
                { email: new RegExp(searchValue, 'i') },
                { mobile: new RegExp(searchValue, 'i') },
                { typeOfService: new RegExp(searchValue, 'i') },
                { message: new RegExp(searchValue, 'i') }
            ];
        } else {
            if (nameSearch) {
                query.name = new RegExp(nameSearch, 'i');
            }
            if (emailSearch) {
                query.email = new RegExp(emailSearch, 'i');
            }
            if (mobileSearch) {
                query.mobile = new RegExp(mobileSearch, 'i');
            }
            if (statusSearch) {
                query.status = statusSearch; // Assuming status is stored as a string or number
            }
            if (typeOfServiceSearch) {
                query.typeOfService = new RegExp(typeOfServiceSearch, 'i');
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
                case 1: // Name column
                    sort.name = sortDirection;
                    break;
                case 2: // Email column
                    sort.email = sortDirection;
                    break;
                case 3: // Mobile column
                    sort.mobile = sortDirection;
                    break;
                case 4: // Type of Service column
                    sort.typeOfService = sortDirection;
                    break;
                case 5: // Status column (assuming you want to sort by status)
                    sort.status = sortDirection;
                    break;
                case 7: // Created At column (index 7 in your HTML table)
                    sort.createdAt = sortDirection;
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

        const contacts = await Contact.find(query)
            .skip(Number(start))
            .limit(Number(length))
            .sort(sort); // Apply the sort order

        const totalRecords = await Contact.countDocuments();
        const filteredRecords = await Contact.countDocuments(query);

        res.json({
            draw: req.body.draw,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: contacts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

}

const downloadAllContactsCsv = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });

        if (contacts.length === 0) {
            return res.status(200).send("No contacts to download.");
        }

        const headers = [
            "Name",
            "Email",
            "Mobile",
            "Type of Service",
            "Status",
            "Message",
            "Created At"
        ];

        const csvRows = contacts.map(contact => [
            `"${contact.name?.replace(/"/g, '""')}"`,
            `"${contact.email?.replace(/"/g, '""')}"`,
            `"${contact.mobile?.replace(/"/g, '""')}"`,
            `"${contact.typeOfService?.replace(/"/g, '""')}"`,
            contact.status === 1 ? "Active" : (contact.status === 2 ? "Inactive" : ""),
            `"${contact.message?.replace(/"/g, '""').replace(/\r?\n|\r/g, ' ')}"`,
            moment(contact.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        ].join(","));

        const csvData = [headers.join(","), ...csvRows].join("\n");

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');

        res.status(200).send(csvData);

    } catch (error) {
        console.error("Error downloading all contacts as CSV:", error);
        res.status(500).send("Error downloading CSV file.");
    }
};

module.exports = {
    contactUsPage,
    contactList,
    downloadAllContactsCsv
};