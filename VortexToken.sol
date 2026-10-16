// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VortexToken {
    string public name = "Vortex Token";
    string public symbol = "VTX";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    // Keeps track of everyone's balance
    mapping(address => uint256) public balanceOf;

    // Owner of the contract (the deployer)
    address public owner;

    // Event emitted when tokens are transferred
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    // Event emitted when new tokens are minted
    event Mint(address indexed receiver, uint256 amount);

    // Modifier to restrict functions to only the owner (for unauthorized testing)
    modifier onlyOwner() {
        require(msg.sender == owner, "Error: Unauthorized! Only the owner can run this.");
        _;
    }

    // Constructor runs once when deployed
    // Constructor runs once when deployed (Hardcoded to 1,000,000 tokens to bypass Remix input bug)
    constructor(uint256 initialSupply) {
        owner = msg.sender;
        totalSupply = initialSupply * (10 ** uint256(decimals));
        balanceOf[owner] = totalSupply; // Give all initial tokens to the creator
        emit Transfer(address(0), owner, totalSupply);
    }

    // Function to transfer tokens (Valid & Invalid input testing)
    function transfer(address recipient, uint256 amount) public returns (bool) {
        require(recipient != address(0), "Error: Invalid recipient address.");
        require(balanceOf[msg.sender] >= amount, "Error: Insufficient balance!"); // Invalid input test

        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    // Function to mint new tokens (Unauthorized input testing)
    function mint(address receiver, uint256 amount) public onlyOwner {
        require(receiver != address(0), "Error: Invalid receiver address.");
        
        totalSupply += amount * (10 ** uint256(decimals));
        balanceOf[receiver] += amount * (10 ** uint256(decimals));
        
        emit Mint(receiver, amount);
    }
}