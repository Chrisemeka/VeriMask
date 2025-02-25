// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract IdentityVerification {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    // Just a simple function to test
    function getOwner() public view returns (address) {
        return owner;
    }
}