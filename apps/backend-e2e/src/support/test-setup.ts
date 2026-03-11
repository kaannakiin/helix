import axios from 'axios';
import { E2E_BASE_URL } from './e2e-env.js';

module.exports = async function () {
  axios.defaults.baseURL = E2E_BASE_URL;
};
