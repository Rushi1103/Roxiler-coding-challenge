const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 5000;
const DB_URI = 'mongodb://localhost:27017/transactionDB';
const API_URL = 'https://s3.amazonaws.com/roxiler.com/product_transaction.json';

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('MongoDB connection error:', error));

// Define transaction schema and model
const transactionSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  price: Number,
  sold: Boolean,
  dateOfSale: Date,
  category: String
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Initialize the database with data from the API
app.get('/api/init', async (req, res) => {
  try {
    const response = await axios.get(API_URL);
    await Transaction.deleteMany({});
    await Transaction.insertMany(response.data);
    res.status(200).send('Database initialized successfully');
  } catch (error) {
    res.status(500).json({ message: 'Error initializing database', error: error.message });
  }
});

// Filter transactions by month
const filterByMonth = (data, month) => {
  const monthIndex = new Date(Date.parse(month + " 1, 2023")).getMonth();
  return data.filter(transaction => new Date(transaction.dateOfSale).getMonth() === monthIndex);
};

// Transactions endpoint
app.get('/api/transactions', async (req, res) => {
  const { month = 'March', search = '', page = 1, perPage = 10 } = req.query;

  try {
    const transactions = await Transaction.find({
      $or: [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { price: new RegExp(search, 'i') }
      ]
    });

    const filteredTransactions = filterByMonth(transactions, month);

    // Pagination
    const total = filteredTransactions.length;
    const paginatedTransactions = filteredTransactions.slice((page - 1) * perPage, page * perPage);

    res.json({
      transactions: paginatedTransactions,
      total,
      page: parseInt(page),
      perPage: parseInt(perPage)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

// Statistics endpoint
app.get('/api/statistics', async (req, res) => {
  const { month = 'March' } = req.query;

  try {
    const transactions = await Transaction.find({});
    const filteredTransactions = filterByMonth(transactions, month);

    const totalSales = filteredTransactions.reduce((sum, transaction) => sum + transaction.price, 0);
    const totalSoldItems = filteredTransactions.filter(transaction => transaction.sold).length;
    const totalUnsoldItems = filteredTransactions.filter(transaction => !transaction.sold).length;

    res.json({ totalSales, totalSoldItems, totalUnsoldItems });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Bar chart endpoint
app.get('/api/chart-data', async (req, res) => {
  const { month = 'March' } = req.query;

  try {
    const transactions = await Transaction.find({});
    const filteredTransactions = filterByMonth(transactions, month);

    const priceRanges = {
      '0-100': 0,
      '101-200': 0,
      '201-300': 0,
      '301-400': 0,
      '401-500': 0,
      '501-600': 0,
      '601-700': 0,
      '701-800': 0,
      '801-900': 0,
      '901+': 0
    };

    filteredTransactions.forEach(transaction => {
      const price = transaction.price;
      if (price <= 100) priceRanges['0-100']++;
      else if (price <= 200) priceRanges['101-200']++;
      else if (price <= 300) priceRanges['201-300']++;
      else if (price <= 400) priceRanges['301-400']++;
      else if (price <= 500) priceRanges['401-500']++;
      else if (price <= 600) priceRanges['501-600']++;
      else if (price <= 700) priceRanges['601-700']++;
      else if (price <= 800) priceRanges['701-800']++;
      else if (price <= 900) priceRanges['801-900']++;
      else priceRanges['901+']++;
    });

    res.json(priceRanges);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chart data', error: error.message });
  }
});

// Pie chart endpoint
app.get('/api/pie-data', async (req, res) => {
  const { month = 'March' } = req.query;

  try {
    const transactions = await Transaction.find({});
    const filteredTransactions = filterByMonth(transactions, month);

    const categoryCounts = {};
    filteredTransactions.forEach(transaction => {
      categoryCounts[transaction.category] = (categoryCounts[transaction.category] || 0) + 1;
    });

    res.json(categoryCounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pie chart data', error: error.message });
  }
});

// Combined data endpoint
app.get('/api/combined-data', async (req, res) => {
  const { month = 'March' } = req.query;

  try {
    const [transactions, statistics, chartData, pieData] = await Promise.all([
      axios.get(`http://localhost:${PORT}/api/transactions`, { params: { month } }),
      axios.get(`http://localhost:${PORT}/api/statistics`, { params: { month } }),
      axios.get(`http://localhost:${PORT}/api/chart-data`, { params: { month } }),
      axios.get(`http://localhost:${PORT}/api/pie-data`, { params: { month } })
    ]);

    res.json({
      transactions: transactions.data,
      statistics: statistics.data,
      chartData: chartData.data,
      pieData: pieData.data
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching combined data', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
