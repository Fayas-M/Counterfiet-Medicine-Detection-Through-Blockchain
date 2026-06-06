// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MedicineSupplyChain
 * @dev Smart contract for tracking medicine supply chain and preventing counterfeits
 */
contract MedicineSupplyChain {
    
    // Medicine structure
    struct Medicine {
        uint id;
        string name;
        string brand;
        string serialNumber;
        uint price;
        address manufacturer;
        address currentOwner;
        bool sold;
        uint timestamp;
    }
    
    // State variables
    uint private medicineCounter;
    mapping(string => Medicine) public medicines;
    mapping(string => bool) private serialNumberExists;
    
    // Events
    event MedicineRegistered(
        uint indexed id,
        string serialNumber,
        string name,
        address indexed manufacturer,
        uint timestamp
    );
    
    event OwnershipTransferred(
        string indexed serialNumber,
        address indexed from,
        address indexed to,
        uint timestamp
    );
    
    event MedicineSold(
        string indexed serialNumber,
        address indexed retailer,
        address indexed customer,
        uint timestamp
    );
    
    // Modifiers
    modifier onlyManufacturer(string memory _serialNumber) {
        require(
            medicines[_serialNumber].manufacturer == msg.sender,
            "Only manufacturer can perform this action"
        );
        _;
    }
    
    modifier onlyCurrentOwner(string memory _serialNumber) {
        require(
            medicines[_serialNumber].currentOwner == msg.sender,
            "Only current owner can perform this action"
        );
        _;
    }
    
    modifier medicineExists(string memory _serialNumber) {
        require(
            serialNumberExists[_serialNumber],
            "Medicine does not exist"
        );
        _;
    }
    
    modifier notSold(string memory _serialNumber) {
        require(
            !medicines[_serialNumber].sold,
            "Medicine already sold"
        );
        _;
    }
    
    /**
     * @dev Register a new medicine
     * @param _name Medicine name
     * @param _brand Brand name
     * @param _serialNumber Unique serial number
     * @param _price Price in wei
     */
    function registerMedicine(
        string memory _name,
        string memory _brand,
        string memory _serialNumber,
        uint _price
    ) public {
        require(
            !serialNumberExists[_serialNumber],
            "Serial number already exists"
        );
        require(
            bytes(_serialNumber).length > 0,
            "Serial number cannot be empty"
        );
        require(
            bytes(_name).length > 0,
            "Name cannot be empty"
        );
        
        medicineCounter++;
        
        medicines[_serialNumber] = Medicine({
            id: medicineCounter,
            name: _name,
            brand: _brand,
            serialNumber: _serialNumber,
            price: _price,
            manufacturer: msg.sender,
            currentOwner: msg.sender,
            sold: false,
            timestamp: block.timestamp
        });
        
        serialNumberExists[_serialNumber] = true;
        
        emit MedicineRegistered(
            medicineCounter,
            _serialNumber,
            _name,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Transfer medicine to retailer
     * @param _serialNumber Serial number of the medicine
     * @param _retailer Address of the retailer
     */
    function transferToRetailer(
        string memory _serialNumber,
        address _retailer
    ) 
        public 
        medicineExists(_serialNumber)
        onlyCurrentOwner(_serialNumber)
        notSold(_serialNumber)
    {
        require(
            _retailer != address(0),
            "Invalid retailer address"
        );
        
        address previousOwner = medicines[_serialNumber].currentOwner;
        medicines[_serialNumber].currentOwner = _retailer;
        
        emit OwnershipTransferred(
            _serialNumber,
            previousOwner,
            _retailer,
            block.timestamp
        );
    }
    
    /**
     * @dev Sell medicine to customer
     * @param _serialNumber Serial number of the medicine
     * @param _customer Address of the customer
     */
    function sellToCustomer(
        string memory _serialNumber,
        address _customer
    ) 
        public 
        medicineExists(_serialNumber)
        onlyCurrentOwner(_serialNumber)
        notSold(_serialNumber)
    {
        require(
            _customer != address(0),
            "Invalid customer address"
        );
        
        address previousOwner = medicines[_serialNumber].currentOwner;
        medicines[_serialNumber].currentOwner = _customer;
        medicines[_serialNumber].sold = true;
        
        emit MedicineSold(
            _serialNumber,
            previousOwner,
            _customer,
            block.timestamp
        );
    }
    
    /**
     * @dev Verify medicine authenticity
     * @param _serialNumber Serial number to verify
     * @return id Medicine ID
     * @return name Medicine name
     * @return brand Medicine brand
     * @return price Medicine price
     * @return manufacturer Manufacturer address
     * @return currentOwner Current medicine owner address
     * @return sold Whether medicine is sold
     * @return timestamp Registration timestamp
     */
    function verifyMedicine(string memory _serialNumber)
        public
        view
        returns (
            uint id,
            string memory name,
            string memory brand,
            uint price,
            address manufacturer,
            address currentOwner,
            bool sold,
            uint timestamp
        )
    {
        require(
            serialNumberExists[_serialNumber],
            "Medicine not found - possible counterfeit"
        );
        
        Medicine memory med = medicines[_serialNumber];
        
        return (
            med.id,
            med.name,
            med.brand,
            med.price,
            med.manufacturer,
            med.currentOwner,
            med.sold,
            med.timestamp
        );
    }
    
    /**
     * @dev Get medicine details
     * @param _serialNumber Serial number
     * @return Medicine struct
     */
    function getMedicine(string memory _serialNumber)
        public
        view
        medicineExists(_serialNumber)
        returns (Medicine memory)
    {
        return medicines[_serialNumber];
    }
    
    /**
     * @dev Check if serial number exists
     * @param _serialNumber Serial number to check
     * @return bool
     */
    function isSerialNumberValid(string memory _serialNumber)
        public
        view
        returns (bool)
    {
        return serialNumberExists[_serialNumber];
    }
    
    /**
     * @dev Get total number of medicines registered
     * @return uint
     */
    function getTotalMedicines() public view returns (uint) {
        return medicineCounter;
    }
}
