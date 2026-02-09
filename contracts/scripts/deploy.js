const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("Deploying HolyMon contracts to Monad testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get contract factories
  const TokenLaunchpad = await ethers.getContractFactory("TokenLaunchpad");
  const MONStaking = await ethers.getContractFactory("MONStaking");

  // Deploy TokenLaunchpad with zero address (no AgentRegistry dependency)
  console.log("\nDeploying TokenLaunchpad...");
  const tokenLaunchpad = await TokenLaunchpad.deploy();
  await tokenLaunchpad.waitForDeployment();
  const tokenLaunchpadAddress = await tokenLaunchpad.getAddress();
  console.log("TokenLaunchpad deployed at:", tokenLaunchpadAddress);

  // Deploy MONStaking
  console.log("\nDeploying MONStaking...");
  const monStaking = await MONStaking.deploy();
  await monStaking.waitForDeployment();
  const monStakingAddress = await monStaking.getAddress();
  console.log("MONStaking deployed at:", monStakingAddress);

  // Print deployment summary
  console.log("\n" + "=".repeat(50));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(50));
  console.log("TokenLaunchpad:", tokenLaunchpadAddress);
  console.log("MONStaking:", monStakingAddress);
  console.log("=".repeat(50));

  // Save addresses for backend integration
  const fs = require("fs");
  const addresses = `TOKEN_LAUNCHPAD_ADDRESS=${tokenLaunchpadAddress}\nMON_STAKING_ADDRESS=${monStakingAddress}\n`;
  fs.writeFileSync("deployed_addresses.txt", addresses);
  console.log("\nAddresses saved to deployed_addresses.txt");

  return {
    tokenLaunchpad: tokenLaunchpadAddress,
    monStaking: monStakingAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });