import React, { useState } from 'react';
import TransactionsTable from './TransactionsTable';
import Statistics from './Statistics';
import TransactionsChart from './TransactionsChart';

const Dashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState('March');

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Transaction Dashboard</h1>
      <div className="flex justify-between items-center my-4">
        <select
          value={selectedMonth}
          onChange={handleMonthChange}
          className="p-2 border border-gray-300 bg-yellow-100"
        >
          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>
      <TransactionsTable selectedMonth={selectedMonth} />
      <Statistics selectedMonth={selectedMonth} />
      <TransactionsChart selectedMonth={selectedMonth} />
    </div>
  );
};

export default Dashboard;
