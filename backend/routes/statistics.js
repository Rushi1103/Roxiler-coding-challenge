// routes/statistics.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const axios = require('axios');

// Route to calculate statistics for the selected month
router.get('/statistics', async (req, res) => {
    try {
        const { month } = req.query;

        const startDate = new Date(`${month} 01, 2022`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        // Calculate total sale amount
        const totalSaleAmount = await Transaction.aggregate([
            {
                $match: {
                    dateOfSale: {
                        $gte: startDate,
                        $lt: endDate
                    },
                    sold: true // Only consider sold items
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$price" }
                }
            }
        ]);

        // Calculate total number of sold items
        const totalSoldItems = await Transaction.countDocuments({
            dateOfSale: {
                $gte: startDate,
                $lt: endDate
            },
            sold: true // Only consider sold items
        });

        // Calculate total number of unsold items
        const totalUnsoldItems = await Transaction.countDocuments({
            dateOfSale: {
                $gte: startDate,
                $lt: endDate
            },
            sold: false // Only consider unsold items
        });

        // Prepare and send response
        const statistics = {
            totalSaleAmount: totalSaleAmount.length > 0 ? totalSaleAmount[0].totalAmount : 0,
            totalSoldItems,
            totalUnsoldItems
        };

        res.json(statistics);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error calculating statistics');
    }
});


// Route to calculate bar chart data for the selected month
router.get('/bar-chart', async (req, res) => {
    try {
        const { month } = req.query;

        const startDate = new Date(`${month} 01, 2022`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        // Query to check if any transactions exist for the selected month
        const transactionsExist = await Transaction.exists({
            dateOfSale: {
                $gte: startDate,
                $lt: endDate
            }
        });

        // If no transactions found, return empty array
        if (!transactionsExist) {
            return res.json([]);
        }

        const barChartData = await Transaction.aggregate([
            {
                $match: {
                    dateOfSale: {
                        $gte: startDate,
                        $lt: endDate
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    '0-100': { $sum: { $cond: [{ $lte: ["$price", 100] }, 1, 0] } },
                    '101-200': { $sum: { $cond: [{ $and: [{ $gt: ["$price", 100] }, { $lte: ["$price", 200] }] }, 1, 0] } },
                    '201-300': { $sum: { $cond: [{ $and: [{ $gt: ["$price", 200] }, { $lte: ["$price", 300] }] }, 1, 0] } },
                    '301-400': { $sum: { $cond: [{ $and: [{ $gt: ["$price", 300] }, { $lte: ["$price", 400] }] }, 1, 0] } },
                    '401-500': { $sum: { $cond: [{ $and: [{ $gt: ["$price", 400] }, { $lte: ["$price", 500] }] }, 1, 0] } },
                    '501-600': { $sum: { $cond: [{ $and: [{ $gt: ["$price", 500] }, { $lte: ["$price", 600] }] }, 1, 0] } },
                    '601-700': { $sum: { $cond: [{ $and: [{ $gt: ["$price", 600] }, { $lte: ["$price", 700] }] }, 1, 0] } },
                    '701-800': { $sum: { $cond: [{ $and: [{ $gt: ["$price", 700] }, { $lte: ["$price", 800] }] }, 1, 0] } },
                    '801-900': { $sum: { $cond: [{ $and: [{ $gt: ["$price", 800] }, { $lte: ["$price", 900] }] }, 1, 0] } },
                    '901-above': { $sum: { $cond: [{ $gt: ["$price", 900] }, 1, 0] } }
                }
            },
            {
                $project: {
                    _id: 0,
                    'price_range': [
                        { range: '0-100', count: '$0-100' },
                        { range: '101-200', count: '$101-200' },
                        { range: '201-300', count: '$201-300' },
                        { range: '301-400', count: '$301-400' },
                        { range: '401-500', count: '$401-500' },
                        { range: '501-600', count: '$501-600' },
                        { range: '601-700', count: '$601-700' },
                        { range: '701-800', count: '$701-800' },
                        { range: '801-900', count: '$801-900' },
                        { range: '901-above', count: '$901-above' }
                    ]
                }
            }
        ]);

        res.json(barChartData[0].price_range);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error calculating bar chart data');
    }
});

// Route to calculate statistics for the selected month
router.get('/pie-chart', async (req, res) => {
    try {
        const { month } = req.query;

        const startDate = new Date(`${month} 01, 2022`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        // Find unique categories and count of items for each category
        const categoryCounts = await Transaction.aggregate([
            {
                $match: {
                    dateOfSale: {
                        $gte: startDate,
                        $lt: endDate
                    }
                }
            },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Prepare the response
        const pieChartData = categoryCounts.map(({ _id, count }) => ({
            category: _id,
            count
        }));

        res.json(pieChartData);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error calculating pie chart data');
    }
});

router.get('/combined-data', async (req, res) => {
    try {
        // Array to store promises for fetching data from each API
        const apiPromises = [
            axios.get('http://localhost:5000/statistics/bar-chart?month=January'),
            axios.get('http://localhost:5000/statistics/pie-chart?month=April'),
            axios.get('http://localhost:5000/transactions?page=1&per_page=5&search=forest')
        ];

        // Wait for all API requests to complete
        const responses = await Promise.all(apiPromises);

        // Extract data from each API response
        const combinedData = responses.map((response, index) => {
            console.log(`Response from API ${index + 1}:`, response.data);
            return response.data;
        });

        // Send the combined JSON response
        res.json(combinedData);
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code that falls out of the range of 2xx
            console.error(`Error response from API: ${error.response.status}`);
            console.error(error.response.data);
            res.status(error.response.status).send(error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request);
            res.status(500).send('No response received from one or more APIs');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error setting up request:', error.message);
            res.status(500).send('Error setting up request');
        }
    }
});

module.exports = router;
