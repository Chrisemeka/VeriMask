// javascript
require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,  // Default Ganache GUI port
      network_id: "*"
    }
  },
  compilers: {
    solc: {
      version: "0.8.17"
    }
  }
};