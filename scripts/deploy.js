// Hardhat deployment script for MedicineSupplyChain contract

import hre from "hardhat";
import fs from "fs";

async function main() {
  console.log("Deploying MedicineSupplyChain contract...");

  // Get the contract factory
  const MedicineSupplyChain = await hre.ethers.getContractFactory("MedicineSupplyChain");
  
  // Deploy the contract
  const medicineSupplyChain = await MedicineSupplyChain.deploy();
  
  // Wait for deployment to complete
  await medicineSupplyChain.waitForDeployment();
  
  const contractAddress = await medicineSupplyChain.getAddress();
  
  console.log("MedicineSupplyChain deployed to:", contractAddress);
  
  // Verify the contract on Etherscan (optional)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await medicineSupplyChain.deploymentTransaction().wait(6);
    
    console.log("Verifying contract on Etherscan...");
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
  }
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: hre.network.name,
    deployer: (await hre.ethers.getSigners())[0].address,
    timestamp: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment info saved to deployment-info.json");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
