// Render the Faq management page

const FTL = require('../../../api/user/models/ftlPaymentModal');

const ftlPage = (req, res) => {
    res.render('pages/ftlManagement/ftl');
};

const moment = require('moment');

const ftlList = async (req, res) => {
    try {
        const { start = 0, length = 10, search = {}, order = [], draw } = req.body;
        const searchValue = search?.value?.trim();
        const { serviceName, status, createdAt } = req.body;

        let query = {};
        let sort = {};

        // Global Search
        if (searchValue) {
            query.$or = [
                { serviceName: new RegExp(searchValue, 'i') },
                { orderId: new RegExp(searchValue, 'i') },
                { vehcileName: new RegExp(searchValue, 'i') },
                { pickupAddress: new RegExp(searchValue, 'i') },
                { dropAddress: new RegExp(searchValue, 'i') },
                // Add more fields if needed
            ];
        } else {
            // Individual column search
            if (serviceName) {
                query.serviceName = new RegExp(serviceName, 'i');
            }
            if (createdAt) {
                const startDate = moment(createdAt).startOf('day').toDate();
                const endDate = moment(createdAt).endOf('day').toDate();
                query.createdAt = { $gte: startDate, $lte: endDate };
            }
        }

        // Sorting logic
        if (order.length > 0) {
            const columnIndex = parseInt(order[0].column);
            const direction = order[0].dir === 'asc' ? 1 : -1;

            const columnMap = {
                1: 'pickupAddress',
                2: 'dropAddress',
                3: 'vehcileName',
                4: 'vehcileBodyType',
                5: 'driverName', // should be populated or replaced
                6: 'userName',   // should be populated or replaced
                7: 'orderId',
                8: 'orderStatus',
                9: 'isAccepted',
                10: 'isPartialPayment',
                11: 'transactionStatus',
                12: 'isWalletPay',
                13: 'totalPayment',
                14: 'prePayment',
                15: 'postPayment',
                16: 'subTotal',
                17: 'shippingCost',
                18: 'specialHandling',
                19: 'gst',
                20: 'gstPercentage',
                21: 'prePaymentPercentage'
            };

            const sortField = columnMap[columnIndex];
            if (sortField) {
                sort[sortField] = direction;
            } else {
                sort.createdAt = -1;
            }
        } else {
            sort.createdAt = -1; // Default sort
        }

        const totalRecords = await FTL.countDocuments();
        const filteredRecords = await FTL.countDocuments(query);
        const ftlDetails = await FTL.find(query)
            .skip(Number(start))
            .limit(Number(length))
            .sort(sort)
            .populate({ path: 'userId', select: 'fullName' })
            .populate({ path: 'driverId', select: 'personalInfo.name' });

        return res.status(200).json({
            draw,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: ftlDetails
        });
    } catch (error) {
        console.error('FTL List Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = { ftlPage, ftlList }