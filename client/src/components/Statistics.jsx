import React from 'react';

const Statistics = ({ statistics }) => {
  return (
    <div className="card mt-4 bg-warning">
      <div className="card-body">
        <h2 className="card-title">Statistics</h2>
        <p className="card-text">Total Sales: {statistics.totalSales}</p>
        <p className="card-text">Total Sold Items: {statistics.totalSoldItems}</p>
        <p className="card-text">Total Unsold Items: {statistics.totalUnsoldItems}</p>
      </div>
    </div>
  );
};

export default Statistics;
