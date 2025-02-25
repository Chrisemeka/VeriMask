from web3 import Web3
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Load contract ABI
with open('path/to/IdentityVerification.json', 'r') as f:
    contract_data = json.load(f)
    CONTRACT_ABI = contract_data['abi']

CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS')
WEB3_PROVIDER = os.getenv('WEB3_PROVIDER', 'http://localhost:7545')
PRIVATE_KEY = os.getenv('ETHEREUM_PRIVATE_KEY')

def get_web3():
    return Web3(Web3.HTTPProvider(WEB3_PROVIDER))

def get_contract():
    web3 = get_web3()
    return web3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

def get_account():
    web3 = get_web3()
    account = web3.eth.account.from_key(PRIVATE_KEY)
    return account

# Document functions
def upload_document_to_blockchain(user_address, ipfs_hash, document_type):
    """Upload document info to blockchain"""
    web3 = get_web3()
    contract = get_contract()
    account = get_account()
    
    # Build transaction
    tx = contract.functions.uploadDocument(ipfs_hash, document_type).build_transaction({
        'from': account.address,
        'nonce': web3.eth.get_transaction_count(account.address),
        'gas': 2000000,
        'gasPrice': web3.to_wei('50', 'gwei')
    })
    
    # Sign and send transaction
    signed_tx = web3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    # Wait for receipt
    receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt

def verify_document_on_blockchain(user_address, doc_index, status, notes):
    """Verify a document on the blockchain"""
    web3 = get_web3()
    contract = get_contract()
    account = get_account()
    
    # Build transaction
    tx = contract.functions.verifyDocument(user_address, doc_index, status, notes).build_transaction({
        'from': account.address,
        'nonce': web3.eth.get_transaction_count(account.address),
        'gas': 2000000,
        'gasPrice': web3.to_wei('50', 'gwei')
    })
    
    # Sign and send transaction
    signed_tx = web3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    # Wait for receipt
    receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt

def get_document_from_blockchain(user_address, doc_index):
    """Get document details from blockchain"""
    contract = get_contract()
    return contract.functions.getDocument(user_address, doc_index).call()

class BlockchainManager:
    def __init__(self):
        # Load environment variables
        self.web3_provider = os.getenv('WEB3_PROVIDER', 'http://localhost:7545')
        self.contract_address = os.getenv('CONTRACT_ADDRESS')
        self.private_key = os.getenv('ETHEREUM_PRIVATE_KEY')
        
        # Load contract ABI
        contract_json_path = os.path.join(os.path.dirname(__file__), 'IdentityVerification.json')
        with open(contract_json_path, 'r') as f:
            contract_data = json.load(f)
            self.contract_abi = contract_data['abi']
        
        # Initialize Web3
        self.web3 = Web3(Web3.HTTPProvider(self.web3_provider))
        
        # Initialize contract
        self.contract = self.web3.eth.contract(
            address=self.contract_address,
            abi=self.contract_abi
        )
        
        # Set up account from private key if provided
        if self.private_key:
            self.account = self.web3.eth.account.from_key(self.private_key)
        else:
            self.account = None
    
    def upload_document(self, document_hash, document_type, user_address=None):
        """
        Upload a document to the blockchain
        
        Args:
            document_hash (str): IPFS hash of the document
            document_type (str): Type of document (passport, license, etc.)
            user_address (str, optional): Ethereum address of the user. If not provided, 
                                         uses the account from private key.
        
        Returns:
            dict: Transaction receipt
        """
        if not self.account:
            raise ValueError("Private key not configured for transactions")
        
        address_to_use = user_address if user_address else self.account.address
        
        # Build transaction
        tx = self.contract.functions.uploadDocument(
            document_hash,
            document_type
        ).build_transaction({
            'from': self.account.address,
            'nonce': self.web3.eth.get_transaction_count(self.account.address),
            'gas': 2000000,
            'gasPrice': self.web3.to_wei('50', 'gwei')
        })
        
        # Sign and send transaction
        signed_tx = self.web3.eth.account.sign_transaction(tx, self.private_key)
        tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for receipt
        return self.web3.eth.wait_for_transaction_receipt(tx_hash)
    
    def verify_document(self, user_address, doc_index, status, notes):
        """
        Verify a document on the blockchain
        
        Args:
            user_address (str): Ethereum address of the document owner
            doc_index (int): Index of the document in the user's document array
            status (str): New status (Verified or Rejected)
            notes (str): Verification notes
        
        Returns:
            dict: Transaction receipt
        """
        if not self.account:
            raise ValueError("Private key not configured for transactions")
        
        # Build transaction
        tx = self.contract.functions.verifyDocument(
            user_address,
            doc_index,
            status,
            notes
        ).build_transaction({
            'from': self.account.address,
            'nonce': self.web3.eth.get_transaction_count(self.account.address),
            'gas': 2000000,
            'gasPrice': self.web3.to_wei('50', 'gwei')
        })
        
        # Sign and send transaction
        signed_tx = self.web3.eth.account.sign_transaction(tx, self.private_key)
        tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for receipt
        return self.web3.eth.wait_for_transaction_receipt(tx_hash)
    
    def add_verifier(self, verifier_address):
        """
        Add a new verifier
        
        Args:
            verifier_address (str): Ethereum address to add as verifier
        
        Returns:
            dict: Transaction receipt
        """
        if not self.account:
            raise ValueError("Private key not configured for transactions")
        
        # Build transaction
        tx = self.contract.functions.addVerifier(
            verifier_address
        ).build_transaction({
            'from': self.account.address,
            'nonce': self.web3.eth.get_transaction_count(self.account.address),
            'gas': 2000000,
            'gasPrice': self.web3.to_wei('50', 'gwei')
        })
        
        # Sign and send transaction
        signed_tx = self.web3.eth.account.sign_transaction(tx, self.private_key)
        tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for receipt
        return self.web3.eth.wait_for_transaction_receipt(tx_hash)
    
    def get_document(self, user_address, doc_index):
        """
        Get document details from blockchain
        
        Args:
            user_address (str): Ethereum address of the document owner
            doc_index (int): Index of the document in the user's document array
        
        Returns:
            tuple: Document details (hash, type, status, timestamp, verifier, notes)
        """
        return self.contract.functions.getDocument(user_address, doc_index).call()
    
    def get_document_count(self, user_address):
        """
        Get the number of documents for a user
        
        Args:
            user_address (str): Ethereum address of the user
        
        Returns:
            int: Number of documents
        """
        return self.contract.functions.getDocumentCount(user_address).call()
    
    def is_verifier(self, address):
        """
        Check if an address is a verifier
        
        Args:
            address (str): Ethereum address to check
        
        Returns:
            bool: True if address is a verifier, False otherwise
        """
        return self.contract.functions.isVerifier(address).call()

   
