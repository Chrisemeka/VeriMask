const IdentityVerification = artifacts.require("IdentityVerification");

module.exports = async function(deployer, network, accounts) {
  // Deploy the contract to the first account
  await deployer.deploy(IdentityVerification, { from: accounts[0] });
  
  // Get the deployed contract instance
  const identityVerification = await IdentityVerification.deployed();
  
  // Log the contract address
  console.log(`IdentityVerification deployed at: ${identityVerification.address}`);
  
  // You can save this address to a file or use it as needed
  console.log('Copy this address to your BlockchainService.js file');
};