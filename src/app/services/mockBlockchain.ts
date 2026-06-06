// Mock Blockchain Service - Simulates Ethereum smart contract interactions

export interface Medicine {
  id: number;
  name: string;
  brand: string;
  serialNumber: string;
  price: number;
  manufacturer: string;
  currentOwner: string;
  sold: boolean;
  transactionHash: string;
  timestamp: number;
  history: TransferEvent[];
}

export interface TransferEvent {
  from: string;
  to: string;
  timestamp: number;
  transactionHash: string;
  eventType: 'registered' | 'transferred_to_distributor' | 'transferred_to_retailer' | 'sold';
}

export interface Report {
  id: number;
  serialNumber: string;
  medicineName: string;
  manufacturer: string;
  timestamp: number;
  message: string;
}

class MockBlockchain {
  private medicines: Map<string, Medicine> = new Map();
  private reports: Report[] = [];
  private nextId = 1;
  private nextReportId = 1;

  // Generate mock transaction hash
  private generateTxHash(): string {
    return '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  // Generate mock address
  private generateAddress(): string {
    return '0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  // Register new medicine (Manufacturer only)
  async registerMedicine(
    name: string,
    brand: string,
    serialNumber: string,
    price: number,
    manufacturer: string
  ): Promise<{ success: boolean; txHash: string; medicine?: Medicine; error?: string }> {
    // Check if serial number already exists
    if (this.medicines.has(serialNumber)) {
      return { success: false, txHash: '', error: 'Serial number already exists' };
    }

    const txHash = this.generateTxHash();
    const medicine: Medicine = {
      id: this.nextId++,
      name,
      brand,
      serialNumber,
      price,
      manufacturer,
      currentOwner: manufacturer,
      sold: false,
      transactionHash: txHash,
      timestamp: Date.now(),
      history: [{
        from: '0x0000000000000000000000000000000000000000',
        to: manufacturer,
        timestamp: Date.now(),
        transactionHash: txHash,
        eventType: 'registered'
      }]
    };

    this.medicines.set(serialNumber, medicine);
    
    // Simulate blockchain delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return { success: true, txHash, medicine };
  }

  // Edit medicine details (Manufacturer only)
  async updateMedicine(
    serialNumber: string,
    name: string,
    brand: string,
    price: number,
    manufacturer: string
  ): Promise<{ success: boolean; txHash: string; error?: string }> {
    const medicine = this.medicines.get(serialNumber);

    if (!medicine) {
      return { success: false, txHash: '', error: 'Medicine not found' };
    }

    if (medicine.manufacturer !== manufacturer) {
      return { success: false, txHash: '', error: 'Not authorized: not the manufacturer' };
    }

    if (medicine.currentOwner !== manufacturer || medicine.sold) {
      return { success: false, txHash: '', error: 'Cannot edit: medicine already transferred or sold' };
    }

    medicine.name = name;
    medicine.brand = brand;
    medicine.price = price;
    
    const txHash = this.generateTxHash();
    
    // Simulate blockchain delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return { success: true, txHash };
  }

  // Delete medicine details (Manufacturer only)
  async deleteMedicine(
    serialNumber: string,
    manufacturer: string
  ): Promise<{ success: boolean; txHash: string; error?: string }> {
    const medicine = this.medicines.get(serialNumber);

    if (!medicine) {
      return { success: false, txHash: '', error: 'Medicine not found' };
    }

    if (medicine.manufacturer !== manufacturer) {
      return { success: false, txHash: '', error: 'Not authorized: not the manufacturer' };
    }

    if (medicine.currentOwner !== manufacturer || medicine.sold) {
      return { success: false, txHash: '', error: 'Cannot delete: medicine already transferred or sold' };
    }

    this.medicines.delete(serialNumber);
    
    const txHash = this.generateTxHash();

    // Simulate blockchain delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return { success: true, txHash };
  }

  // Transfer to retailer
  async transferToRetailer(
    serialNumber: string,
    retailer: string,
    currentOwner: string
  ): Promise<{ success: boolean; txHash: string; error?: string }> {
    const medicine = this.medicines.get(serialNumber);

    if (!medicine) {
      return { success: false, txHash: '', error: 'Medicine not found' };
    }

    if (medicine.currentOwner !== currentOwner) {
      return { success: false, txHash: '', error: 'Not authorized: not the current owner' };
    }

    if (medicine.sold) {
      return { success: false, txHash: '', error: 'Medicine already sold to customer' };
    }

    const txHash = this.generateTxHash();
    medicine.currentOwner = retailer;
    medicine.history.push({
      from: currentOwner,
      to: retailer,
      timestamp: Date.now(),
      transactionHash: txHash,
      eventType: 'transferred_to_retailer'
    });

    // Simulate blockchain delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return { success: true, txHash };
  }

  // Transfer to distributor
  async transferToDistributor(
    serialNumber: string,
    distributor: string,
    currentOwner: string
  ): Promise<{ success: boolean; txHash: string; error?: string }> {
    const medicine = this.medicines.get(serialNumber);

    if (!medicine) {
      return { success: false, txHash: '', error: 'Medicine not found' };
    }

    if (medicine.currentOwner !== currentOwner) {
      return { success: false, txHash: '', error: 'Not authorized: not the current owner' };
    }

    if (medicine.sold) {
      return { success: false, txHash: '', error: 'Medicine already sold to customer' };
    }

    const txHash = this.generateTxHash();
    medicine.currentOwner = distributor;
    medicine.history.push({
      from: currentOwner,
      to: distributor,
      timestamp: Date.now(),
      transactionHash: txHash,
      eventType: 'transferred_to_distributor'
    });

    // Simulate blockchain delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return { success: true, txHash };
  }

  // Sell to customer
  async sellToCustomer(
    serialNumber: string,
    customer: string,
    currentOwner: string
  ): Promise<{ success: boolean; txHash: string; error?: string }> {
    const medicine = this.medicines.get(serialNumber);

    if (!medicine) {
      return { success: false, txHash: '', error: 'Medicine not found' };
    }

    if (medicine.currentOwner !== currentOwner) {
      return { success: false, txHash: '', error: 'Not authorized: not the current owner' };
    }

    if (medicine.sold) {
      return { success: false, txHash: '', error: 'Medicine already sold' };
    }

    const txHash = this.generateTxHash();
    medicine.currentOwner = customer;
    medicine.sold = true;
    medicine.history.push({
      from: currentOwner,
      to: customer,
      timestamp: Date.now(),
      transactionHash: txHash,
      eventType: 'sold'
    });

    // Simulate blockchain delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return { success: true, txHash };
  }

  // Consume medicine (mark as sold by consumer scan)
  async consumeMedicine(serialNumber: string): Promise<{ success: boolean; error?: string }> {
    const medicine = this.medicines.get(serialNumber);

    if (!medicine) {
      return { success: false, error: 'Medicine not found' };
    }

    if (medicine.sold) {
      return { success: false, error: 'Medicine already sold' };
    }

    const txHash = this.generateTxHash();
    const previousOwner = medicine.currentOwner;
    medicine.currentOwner = 'Consumer';
    medicine.sold = true;
    medicine.history.push({
      from: previousOwner,
      to: 'Consumer',
      timestamp: Date.now(),
      transactionHash: txHash,
      eventType: 'sold'
    });

    return { success: true };
  }

  // Verify medicine
  async verifyMedicine(serialNumber: string): Promise<Medicine | null> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return this.medicines.get(serialNumber) || null;
  }

  // Get all medicines
  getAllMedicines(): Medicine[] {
    return Array.from(this.medicines.values());
  }

  // Get medicines by manufacturer
  getMedicinesByManufacturer(manufacturer: string): Medicine[] {
    return Array.from(this.medicines.values())
      .filter(m => m.manufacturer === manufacturer);
  }

  // Get medicines by current owner
  getMedicinesByOwner(owner: string): Medicine[] {
    return Array.from(this.medicines.values())
      .filter(m => m.currentOwner === owner);
  }

  // Report suspicious medicine
  async reportMedicine(serialNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
    const medicine = this.medicines.get(serialNumber);
    if (!medicine) {
      return { success: false, error: 'Medicine not found' };
    }

    const report: Report = {
      id: this.nextReportId++,
      serialNumber: medicine.serialNumber,
      medicineName: medicine.name,
      manufacturer: medicine.manufacturer,
      timestamp: Date.now(),
      message
    };

    this.reports.push(report);
    
    // Simulate blockchain/network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true };
  }

  getAllReports(): Report[] {
    return [...this.reports].sort((a, b) => b.timestamp - a.timestamp);
  }

  getReportsByManufacturer(manufacturer: string): Report[] {
    return this.reports.filter(r => r.manufacturer === manufacturer).sort((a, b) => b.timestamp - a.timestamp);
  }
}

// Singleton instance
export const mockBlockchain = new MockBlockchain();
