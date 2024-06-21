// routes/transactions.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Transaction = require('../models/Transaction.js');

// Route to initialize the database with data from third-party API
router.get('/init', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const transactions = response.data;

        await Transaction.deleteMany({}); // Clear existing data
        await Transaction.insertMany(transactions); // Insert new data

        res.status(200).send('Database initialized with seed data');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error initializing database');
    }
});

// Route to list all transactions with optional search and pagination
router.get('/', async (req, res) => {
  try {
      const { page = 1, per_page = 10, search = '', month } = req.query;

      const query = {};
      const searchQuery = [];

      if (search) {
          searchQuery.push(
              { title: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
          );
          
          // Add price condition only if search parameter is explicitly 'price'
          if (!isNaN(parseFloat(search)) && isFinite(search)) {
              searchQuery.push({ price: parseFloat(search) });
          }
      }

      if (searchQuery.length > 0) {
          query.$or = searchQuery;
      }

      if (month) {
          const startDate = new Date(`2021-${new Date(`${month} 1`).getMonth() + 1}-01`);
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 1);

          query.dateOfSale = {
              $gte: startDate,
              $lt: endDate
          };
      }

      const transactions = await Transaction.find(query)
          .skip((page - 1) * per_page)
          .limit(Number(per_page));

      const total = await Transaction.countDocuments(query);

      res.json({
          page: Number(page),
          per_page: Number(per_page),
          total,
          total_pages: Math.ceil(total / per_page),
          transactions,
      });
  } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching transactions: ' + error.message);
  }
});

// router.get('/statistics', async (req, res) => {
//   try {
//       const { month } = req.query;

//       const startDate = new Date(`2021-${new Date(`${month} 1`).getMonth() + 1}-01`);
//       const endDate = new Date(startDate);
//       endDate.setMonth(endDate.getMonth() + 1);

//       const statistics = await Transaction.aggregate([
//           {
//               $match: {
//                   dateOfSale: {
//                       $gte: startDate,
//                       $lt: endDate
//                   }
//               }
//           },
//           {
//               $group: {
//                   _id: null,
//                   totalSaleAmount: { $sum: "$price" },
//                   totalSoldItems: { $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] } },
//                   totalUnsoldItems: { $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] } }
//               }
//           }
//       ]);

//       if (statistics.length === 0) {
//           return res.status(404).json({ message: "No transactions found for the selected month" });
//       }

//       res.json(statistics[0]);
//   } catch (error) {
//       console.error(error);
//       res.status(500).send('Error calculating statistics');
//   }
// });


module.exports = router;
