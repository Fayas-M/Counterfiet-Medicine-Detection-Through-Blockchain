
// Express.js Backend Server for Medicine Supply Chain
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const multer = require('multer');
const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Blockchain connection setup
const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL || 'http://127.0.0.1:8545'
);

// Contract ABI and address (update after deployment)
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x75275ca9b9bcC149727Dac7267B7c1c42803ACf6';
const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "serialNumber",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "manufacturer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "MedicineRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "serialNumber",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "retailer",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "customer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "MedicineSold",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "serialNumber",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_serialNumber",
        "type": "string"
      }
    ],
    "name": "getMedicine",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "brand",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "serialNumber",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "manufacturer",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "currentOwner",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "sold",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct MedicineSupplyChain.Medicine",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalMedicines",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_serialNumber",
        "type": "string"
      }
    ],
    "name": "isSerialNumberValid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "medicines",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "brand",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "serialNumber",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "manufacturer",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "currentOwner",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "sold",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_brand",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_serialNumber",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_price",
        "type": "uint256"
      }
    ],
    "name": "registerMedicine",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_serialNumber",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "_customer",
        "type": "address"
      }
    ],
    "name": "sellToCustomer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_serialNumber",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "_retailer",
        "type": "address"
      }
    ],
    "name": "transferToRetailer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_serialNumber",
        "type": "string"
      }
    ],
    "name": "verifyMedicine",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "brand",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "manufacturer",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "currentOwner",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "sold",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Get medicine by serial number
app.get('/api/medicine/:serialNumber', async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const medicine = await contract.verifyMedicine(serialNumber);

    res.json({
      success: true,
      medicine: {
        id: medicine.id.toString(),
        name: medicine.name,
        brand: medicine.brand,
        price: ethers.formatEther(medicine.price),
        manufacturer: medicine.manufacturer,
        currentOwner: medicine.currentOwner,
        sold: medicine.sold,
        timestamp: medicine.timestamp.toString()
      }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'Medicine not found',
      message: error.message
    });
  }
});

// Register new medicine
app.post('/api/medicine/register', async (req, res) => {
  try {
    const { name, brand, serialNumber, price, privateKey } = req.body;

    // Create wallet from private key
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    // Convert price to wei
    const priceInWei = ethers.parseEther(price.toString());

    // Register medicine
    const tx = await contract.registerMedicine(name, brand, serialNumber, priceInWei);
    await tx.wait();

    res.json({
      success: true,
      transactionHash: tx.hash,
      message: 'Medicine registered successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Transfer to retailer
app.post('/api/medicine/transfer', async (req, res) => {
  try {
    const { serialNumber, retailerAddress, privateKey } = req.body;

    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    const tx = await contract.transferToRetailer(serialNumber, retailerAddress);
    await tx.wait();

    res.json({
      success: true,
      transactionHash: tx.hash,
      message: 'Medicine transferred successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Transfer failed',
      message: error.message
    });
  }
});

// Sell to customer
app.post('/api/medicine/sell', async (req, res) => {
  try {
    const { serialNumber, customerAddress, privateKey } = req.body;

    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    const tx = await contract.sellToCustomer(serialNumber, customerAddress);
    await tx.wait();

    res.json({
      success: true,
      transactionHash: tx.hash,
      message: 'Medicine sold successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Sale failed',
      message: error.message
    });
  }
});

// Get contract stats
app.get('/api/stats', async (req, res) => {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const totalMedicines = await contract.getTotalMedicines();

    res.json({
      success: true,
      stats: {
        totalMedicines: totalMedicines.toString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
});

// --- Digital Watermarking Feature ---
// Note: This implements LSB (Least Significant Bit) watermarking which is 
// conceptually similar to DCT for anti-counterfeiting but easier to implement 
// in a pure Node.js environment without Python bindings.

// String to Binary Helper
const stringToBinary = (str) => {
  let binary = '';
  for (let i = 0; i < str.length; i++) {
    binary += str[i].charCodeAt(0).toString(2).padStart(8, '0');
  }
  return binary + '00000000'; // Null terminator
};

// Binary to String Helper
const binaryToString = (binary) => {
  let str = '';
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8);
    if (byte === '00000000') break; // Null terminator found
    str += String.fromCharCode(parseInt(byte, 2));
  }
  return str;
};

// Embed Watermark API
app.post('/api/watermark/embed', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const { serialNumber } = req.body;
    if (!serialNumber) return res.status(400).json({ error: 'No serial number provided' });

    const image = await Jimp.read(req.file.buffer);
    const binaryMessage = stringToBinary(serialNumber);
    let msgIndex = 0;

    // LSB Embedding in the red channel
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      if (msgIndex < binaryMessage.length) {
        let r = this.bitmap.data[idx + 0];
        const bit = parseInt(binaryMessage[msgIndex]);
        // Clear the least significant bit and set it to our message bit
        r = (r & 0xFE) | bit;
        this.bitmap.data[idx + 0] = r;
        msgIndex++;
      }
    });

    const base64Data = await image.getBase64(Jimp.MIME_PNG);

    res.json({
      success: true,
      message: 'Watermark embedded successfully',
      image: base64Data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Extract Watermark API
app.post('/api/watermark/extract', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const image = await Jimp.read(req.file.buffer);
    let extractedBinary = '';

    // Extract LSB from the red channel
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const bit = r & 1;
      extractedBinary += bit;
    });

    const extractedText = binaryToString(extractedBinary);
    // Clean string from garbage data (since we extract from the entire image)
    const cleanText = extractedText.replace(/[^\x20-\x7E]/g, '');

    res.json({
      success: true,
      extractedData: cleanText.substring(0, 100) || 'No valid watermark found'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Blockchain provider: ${process.env.RPC_URL || 'http://127.0.0.1:8545'}`);
});
