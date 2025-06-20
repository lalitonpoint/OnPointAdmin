// Render the Faq management page

const FTL = require('../../../api/user/models/ftlPaymentModal');

const ftlPage = (req, res) => {
    res.render('pages/ftlManagement/ftl');
};

const moment = require('moment');

const ftlList = async (req, res) => {
    try {
        const { start = 0, length = 10, order = [], draw } = req.body;

        // Custom search filters
        const {
            pickupAddress,
            dropAddress,
            vehcileName,
            isBidding,
            orderId,
            isAccepted,
            isPartialPayment,
            transactionStatus
        } = req.body;

        let query = {};
        let sort = {};

        // Apply custom filters
        if (pickupAddress) {
            query.pickupAddress = { $regex: pickupAddress.trim(), $options: 'i' };
        }
        if (dropAddress) {
            query.dropAddress = { $regex: dropAddress.trim(), $options: 'i' };
        }
        if (vehcileName) {
            query.vehcileName = { $regex: vehcileName.trim(), $options: 'i' };
        }
        if (isBidding !== undefined && isBidding !== '') {
            query.isBidding = parseInt(isBidding);
        }
        if (orderId) {
            query.orderId = { $regex: orderId.trim(), $options: 'i' };
        }
        if (isAccepted !== undefined && isAccepted !== '') {
            query.isAccepted = isAccepted === 'true';
        }
        if (isPartialPayment !== undefined && isPartialPayment !== '') {
            query.isPartialPayment = isPartialPayment === 'true';
        }
        if (transactionStatus !== undefined && transactionStatus !== '') {
            query.transactionStatus = transactionStatus === 'true';
        }

        // Sorting
        if (order.length > 0) {
            const columnIndex = parseInt(order[0].column);
            const direction = order[0].dir === 'asc' ? 1 : -1;

            const columnMap = {
                1: 'pickupAddress',
                2: 'dropAddress',
                3: 'vehcileName',
                4: 'isBidding',
                7: 'orderId',
                9: 'isAccepted',
                10: 'isPartialPayment',
                11: 'transactionStatus',
            };

            const sortField = columnMap[columnIndex];
            if (sortField) {
                sort[sortField] = direction;
            } else {
                sort.createdAt = -1;
            }
        } else {
            sort.createdAt = -1;
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