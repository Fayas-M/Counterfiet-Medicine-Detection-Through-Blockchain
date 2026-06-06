# Medicine Supply Chain Anti-Counterfeiting System

A blockchain-based solution for tracking and verifying medicine authenticity throughout the supply chain using Ethereum smart contracts, QR codes, and React.

## Features

- **Blockchain Security**: Immutable records on Ethereum blockchain
- **QR Code Verification**: Generate and scan QR codes for instant verification
- **Multi-Role System**: Manufacturer, Retailer, Consumer, and Admin dashboards
- **Supply Chain Tracking**: Complete transparency from production to consumer
- **Anti-Counterfeit Protection**: Detect fake medicines immediately
- **Real-time Verification**: Instant blockchain verification

## Technology Stack

### Frontend
- React.js with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- QRCode generation library
- HTML5 QR code scanner
- Ethers.js for blockchain interaction

### Backend
- Node.js
- Express.js
- RESTful API

### Blockchain
- Ethereum Smart Contracts (Solidity)
- Hardhat development environment
- Ganache for local testing
- Ethers.js for Web3 integration

### Database
- Firebase Firestore (for off-chain data)
- Firebase Authentication

## Project Structure

```
/
├── contracts/              # Solidity smart contracts
│   └── MedicineSupplyChain.sol
├── scripts/               # Deployment scripts
│   └── deploy.js
├── backend/               # Express.js backend
│   └── server.js
├── firebase/              # Firebase configuration
│   └── config.js
├── src/
│   └── app/
│       ├── components/    # React components
│       ├── pages/         # Page components
│       │   ├── HomePage.tsx
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── ManufacturerDashboard.tsx
│       │   ├── RetailerDashboard.tsx
│       │   ├── ConsumerVerification.tsx
│       │   └── AdminPanel.tsx
│       ├── services/      # Mock services (for demo)
│       │   ├── mockAuth.ts
│       │   ├── mockBlockchain.ts
│       │   └── qrCodeService.ts
│       └── routes.tsx     # React Router configuration
└── hardhat.config.js      # Hardhat configuration
```

## Getting Started

### Prerequisites

- Node.js v18+
- MetaMask wallet
- Ganache (for local blockchain)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd medicine-supply-chain
```

2. Install frontend dependencies
```bash
npm install
```

3. Install backend dependencies
```bash
cd backend
npm install
cd ..
```

4. Install Hardhat and blockchain dependencies
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### Smart Contract Deployment

1. Start Ganache local blockchain
```bash
ganache-cli
```

2. Compile smart contracts
```bash
npx hardhat compile
```

3. Deploy to local network
```bash
npx hardhat run scripts/deploy.js --network localhost
```

4. Deploy to testnet (Sepolia)
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Running the Application

1. Start the backend server
```bash
cd backend
node server.js
```

2. Start the frontend (in another terminal)
```bash
npm run dev
```

3. Open browser at `http://localhost:5173`

## User Roles

### Manufacturer
- Register new medicines on blockchain
- Generate QR codes for each product
- Track product distribution
- View production history

### Retailer
- Receive medicines from manufacturers
- Verify medicine authenticity
- Sell to customers
- View inventory and transaction history

### Consumer
- Scan QR codes to verify medicines
- View complete supply chain history
- Detect counterfeit products
- Report suspicious medicines

### Admin
- View all system transactions
- Monitor supply chain analytics
- Access complete medicine database
- Generate system reports

## Demo Accounts

The application includes pre-configured demo accounts:

- **Manufacturer**: manufacturer@example.com / password123
- **Retailer**: retailer@example.com / password123
- **Consumer**: consumer@example.com / password123
- **Admin**: admin@example.com / password123

## Smart Contract Functions

### registerMedicine
Register a new medicine on the blockchain
```solidity
function registerMedicine(
    string memory _name,
    string memory _brand,
    string memory _serialNumber,
    uint _price
) public
```

### transferToRetailer
Transfer medicine ownership to a retailer
```solidity
function transferToRetailer(
    string memory _serialNumber,
    address _retailer
) public
```

### sellToCustomer
Sell medicine to end customer
```solidity
function sellToCustomer(
    string memory _serialNumber,
    address _customer
) public
```

### verifyMedicine
Verify medicine authenticity
```solidity
function verifyMedicine(string memory _serialNumber)
    public view returns (...)
```

## QR Code Format

Each QR code contains:
```json
{
  "serialNumber": "MED-2026-001",
  "transactionHash": "0x...",
  "timestamp": 1710518400000
}
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Blockchain
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=your_private_key_here

# Firebase
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id

# Backend
PORT=5000

# Etherscan (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Security Features

1. **Duplicate Prevention**: Serial numbers are unique and cannot be duplicated
2. **Ownership Verification**: Only current owner can transfer medicines
3. **Blockchain Immutability**: Transaction history cannot be altered
4. **QR Code Authentication**: Each QR contains blockchain transaction hash
5. **Role-Based Access**: Different permissions for each user type

## API Endpoints

### GET /api/health
Health check endpoint

### GET /api/medicine/:serialNumber
Get medicine details by serial number

### POST /api/medicine/register
Register new medicine

### POST /api/medicine/transfer
Transfer medicine to retailer

### POST /api/medicine/sell
Sell medicine to customer

### GET /api/stats
Get system statistics

## Testing

Run smart contract tests:
```bash
npx hardhat test
```

## Deployment

### Frontend
```bash
npm run build
```

### Smart Contract to Mainnet
1. Update `hardhat.config.js` with mainnet RPC
2. Add private key to `.env`
3. Deploy:
```bash
npx hardhat run scripts/deploy.js --network mainnet
```

## Future Enhancements

- [ ] Digital watermark verification
- [ ] IPFS integration for medicine images
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] IoT integration for temperature tracking
- [ ] AI-based counterfeit detection
- [ ] Batch QR code generation
- [ ] Export reports (PDF/Excel)

## License

MIT License

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions, please open a GitHub issue.

## Acknowledgments

- Ethereum Foundation
- Hardhat Team
- React Team
- Tailwind CSS Team
