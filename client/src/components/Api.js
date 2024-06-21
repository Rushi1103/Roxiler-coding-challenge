import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const fetchTransactions = (page = 1, perPage = 10, searchQuery = '') => {
  return axios.get(`${API_URL}/transactions`, {
    params: { page, per_page: perPage, search: searchQuery }
  });
};

export const fetchStatistics = (month) => {
  return axios.get(`${API_URL}/statistics/statistics`, { params: { month } });
};

export const fetchPriceRanges = (month) => {
  return axios.get(`${API_URL}/statistics/bar-chart`, { params: { month } });
};

export const fetchCombinedData = () => {
  return axios.get(`${API_URL}/statistics/combined-data`);
};
