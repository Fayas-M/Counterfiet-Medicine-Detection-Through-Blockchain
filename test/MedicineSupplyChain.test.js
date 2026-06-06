// Hardhat test suite for MedicineSupplyChain smart contract
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedicineSupplyChain", function () {
  let MedicineSupplyChain;
  let medicineSupplyChain;
  let manufacturer;
  let retailer;
  let customer;
  let addrs;

  beforeEach(async function () {
    // Get signers
    [manufacturer, retailer, customer, ...addrs] = await ethers.getSigners();

    // Deploy contract
    MedicineSupplyChain = await ethers.getContractFactory("MedicineSupplyChain");
    medicineSupplyChain = await MedicineSupplyChain.deploy();
  });

  describe("Medicine Registration", function () {
    it("Should register a new medicine successfully", async function () {
      const tx = await medicineSupplyChain.connect(manufacturer).registerMedicine(
        "Paracetamol",
        "Tylenol",
        "MED-001",
        ethers.parseEther("10")
      );

      await expect(tx)
        .to.emit(medicineSupplyChain, "MedicineRegistered")
        .withArgs(1, "MED-001", "Paracetamol", manufacturer.address, await time.latest());

      const medicine = await medicineSupplyChain.getMedicine("MED-001");
      expect(medicine.name).to.equal("Paracetamol");
      expect(medicine.brand).to.equal("Tylenol");
      expect(medicine.manufacturer).to.equal(manufacturer.address);
    });

    it("Should fail to register with duplicate serial number", async function () {
      await medicineSupplyChain.connect(manufacturer).registerMedicine(
        "Paracetamol",
        "Tylenol",
        "MED-001",
        ethers.parseEther("10")
      );

      await expect(
        medicineSupplyChain.connect(manufacturer).registerMedicine(
          "Aspirin",
          "Bayer",
          "MED-001",
          ethers.parseEther("15")
        )
      ).to.be.revertedWith("Serial number already exists");
    });

    it("Should fail with empty serial number", async function () {
      await expect(
        medicineSupplyChain.connect(manufacturer).registerMedicine(
          "Paracetamol",
          "Tylenol",
          "",
          ethers.parseEther("10")
        )
      ).to.be.revertedWith("Serial number cannot be empty");
    });

    it("Should increment total medicines count", async function () {
      await medicineSupplyChain.connect(manufacturer).registerMedicine(
        "Paracetamol",
        "Tylenol",
        "MED-001",
        ethers.parseEther("10")
      );

      expect(await medicineSupplyChain.getTotalMedicines()).to.equal(1);

      await medicineSupplyChain.connect(manufacturer).registerMedicine(
        "Aspirin",
        "Bayer",
        "MED-002",
        ethers.parseEther("15")
      );

      expect(await medicineSupplyChain.getTotalMedicines()).to.equal(2);
    });
  });

  describe("Medicine Transfer", function () {
    beforeEach(async function () {
      // Register a medicine first
      await medicineSupplyChain.connect(manufacturer).registerMedicine(
        "Paracetamol",
        "Tylenol",
        "MED-001",
        ethers.parseEther("10")
      );
    });

    it("Should transfer medicine to retailer successfully", async function () {
      const tx = await medicineSupplyChain
        .connect(manufacturer)
        .transferToRetailer("MED-001", retailer.address);

      await expect(tx)
        .to.emit(medicineSupplyChain, "OwnershipTransferred")
        .withArgs("MED-001", manufacturer.address, retailer.address, await time.latest());

      const medicine = await medicineSupplyChain.getMedicine("MED-001");
      expect(medicine.currentOwner).to.equal(retailer.address);
    });

    it("Should fail if not current owner", async function () {
      await expect(
        medicineSupplyChain
          .connect(retailer)
          .transferToRetailer("MED-001", retailer.address)
      ).to.be.revertedWith("Only current owner can perform this action");
    });

    it("Should fail with invalid retailer address", async function () {
      await expect(
        medicineSupplyChain
          .connect(manufacturer)
          .transferToRetailer("MED-001", ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid retailer address");
    });

    it("Should fail if medicine doesn't exist", async function () {
      await expect(
        medicineSupplyChain
          .connect(manufacturer)
          .transferToRetailer("INVALID-001", retailer.address)
      ).to.be.revertedWith("Medicine does not exist");
    });

    it("Should fail if medicine already sold", async function () {
      // Transfer to retailer first
      await medicineSupplyChain
        .connect(manufacturer)
        .transferToRetailer("MED-001", retailer.address);

      // Sell to customer
      await medicineSupplyChain
        .connect(retailer)
        .sellToCustomer("MED-001", customer.address);

      // Try to transfer again - should fail
      await expect(
        medicineSupplyChain
          .connect(customer)
          .transferToRetailer("MED-001", addrs[0].address)
      ).to.be.revertedWith("Medicine already sold");
    });
  });

  describe("Medicine Sale", function () {
    beforeEach(async function () {
      // Register and transfer to retailer
      await medicineSupplyChain.connect(manufacturer).registerMedicine(
        "Paracetamol",
        "Tylenol",
        "MED-001",
        ethers.parseEther("10")
      );
      await medicineSupplyChain
        .connect(manufacturer)
        .transferToRetailer("MED-001", retailer.address);
    });

    it("Should sell medicine to customer successfully", async function () {
      const tx = await medicineSupplyChain
        .connect(retailer)
        .sellToCustomer("MED-001", customer.address);

      await expect(tx)
        .to.emit(medicineSupplyChain, "MedicineSold")
        .withArgs("MED-001", retailer.address, customer.address, await time.latest());

      const medicine = await medicineSupplyChain.getMedicine("MED-001");
      expect(medicine.currentOwner).to.equal(customer.address);
      expect(medicine.sold).to.equal(true);
    });

    it("Should fail if not current owner", async function () {
      await expect(
        medicineSupplyChain
          .connect(manufacturer)
          .sellToCustomer("MED-001", customer.address)
      ).to.be.revertedWith("Only current owner can perform this action");
    });

    it("Should fail with invalid customer address", async function () {
      await expect(
        medicineSupplyChain
          .connect(retailer)
          .sellToCustomer("MED-001", ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid customer address");
    });

    it("Should fail if already sold", async function () {
      // Sell once
      await medicineSupplyChain
        .connect(retailer)
        .sellToCustomer("MED-001", customer.address);

      // Try to sell again
      await expect(
        medicineSupplyChain
          .connect(customer)
          .sellToCustomer("MED-001", addrs[0].address)
      ).to.be.revertedWith("Medicine already sold");
    });
  });

  describe("Medicine Verification", function () {
    beforeEach(async function () {
      await medicineSupplyChain.connect(manufacturer).registerMedicine(
        "Paracetamol",
        "Tylenol",
        "MED-001",
        ethers.parseEther("10")
      );
    });

    it("Should verify existing medicine", async function () {
      const medicine = await medicineSupplyChain.verifyMedicine("MED-001");
      
      expect(medicine.id).to.equal(1);
      expect(medicine.name).to.equal("Paracetamol");
      expect(medicine.brand).to.equal("Tylenol");
      expect(medicine.price).to.equal(ethers.parseEther("10"));
      expect(medicine.manufacturer).to.equal(manufacturer.address);
      expect(medicine.sold).to.equal(false);
    });

    it("Should fail to verify non-existent medicine", async function () {
      await expect(
        medicineSupplyChain.verifyMedicine("FAKE-001")
      ).to.be.revertedWith("Medicine not found - possible counterfeit");
    });

    it("Should check serial number validity", async function () {
      expect(await medicineSupplyChain.isSerialNumberValid("MED-001")).to.equal(true);
      expect(await medicineSupplyChain.isSerialNumberValid("FAKE-001")).to.equal(false);
    });
  });

  describe("Complete Supply Chain Flow", function () {
    it("Should complete full supply chain journey", async function () {
      // Step 1: Manufacturer registers medicine
      await medicineSupplyChain.connect(manufacturer).registerMedicine(
        "Paracetamol",
        "Tylenol",
        "MED-001",
        ethers.parseEther("10")
      );

      let medicine = await medicineSupplyChain.getMedicine("MED-001");
      expect(medicine.currentOwner).to.equal(manufacturer.address);
      expect(medicine.sold).to.equal(false);

      // Step 2: Manufacturer transfers to retailer
      await medicineSupplyChain
        .connect(manufacturer)
        .transferToRetailer("MED-001", retailer.address);

      medicine = await medicineSupplyChain.getMedicine("MED-001");
      expect(medicine.currentOwner).to.equal(retailer.address);
      expect(medicine.sold).to.equal(false);

      // Step 3: Retailer sells to customer
      await medicineSupplyChain
        .connect(retailer)
        .sellToCustomer("MED-001", customer.address);

      medicine = await medicineSupplyChain.getMedicine("MED-001");
      expect(medicine.currentOwner).to.equal(customer.address);
      expect(medicine.sold).to.equal(true);

      // Step 4: Anyone can verify the medicine
      const verifiedMedicine = await medicineSupplyChain.verifyMedicine("MED-001");
      expect(verifiedMedicine.name).to.equal("Paracetamol");
      expect(verifiedMedicine.manufacturer).to.equal(manufacturer.address);
    });
  });

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for registration", async function () {
      const tx = await medicineSupplyChain.connect(manufacturer).registerMedicine(
        "Paracetamol",
        "Tylenol",
        "MED-001",
        ethers.parseEther("10")
      );
      const receipt = await tx.wait();
      
      console.log("Gas used for registration:", receipt.gasUsed.toString());
      expect(receipt.gasUsed).to.be.lessThan(500000);
    });
  });
});
