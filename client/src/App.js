import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TransactionsTable from './components/TransactionsTable';
import Statistics from './components/Statistics';
import BarChart from './components/BarChart';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  const [month, setMonth] = useState('March');
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [chartData, setChartData] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/transactions`, {
        params: { month, search, page }
      });
      console.log(response)
      setTransactions(response.data.transactions);
    } catch (err) {
      setError('Error fetching transactions');
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/statistics`, {
        params: { month }
      });
      setStatistics(response.data);
    } catch (err) {
      setError('Error fetching statistics');
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/chart-data`, {
        params: { month }
      });
      setChartData(response.data);
    } catch (err) {
      setError('Error fetching chart data');
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchStatistics();
    fetchChartData();
  }, [month, search, page]);

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Transaction Dashboard</h1>
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <input
          type="text"
          className="form-control w-auto"
          placeholder="Search transactions"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-select w-auto btn btn-primary"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month) => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>
      <TransactionsTable transactions={transactions} />
      <Statistics statistics={statistics} />
      <BarChart chartData={chartData} />
      <div className="d-flex justify-content-between mt-4">
        <button className="btn btn-primary" onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
        <button className="btn btn-primary" onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
};

export default App;
