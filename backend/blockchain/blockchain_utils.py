import logging
from web3 import Web3
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load contract ABI
CONTRACT_ABI_PATH = os.getenv('CONTRACT_ABI_PATH', 'ekyc-blockchain/build/contracts/IdentityVerification.json')
try:
    with open(CONTRACT_ABI_PATH, 'r') as f:
        contract_data = json.load(f)
        CONTRACT_ABI = contract_data['abi']
except Exception as e:
    logger.error(f"Failed to load contract ABI: {str(e)}")
    raise

CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS')
WEB3_PROVIDER = os.getenv('WEB3_PROVIDER', 'http://localhost:7545')
PRIVATE_KEY = os.getenv('ETHEREUM_PRIVATE_KEY')
GAS_LIMIT = int(os.getenv('GAS_LIMIT', 2000000))
GAS_PRICE = int(os.getenv('GAS_PRICE', 50))  # in gwei

def get_web3():
    return Web3(Web3.HTTPProvider(WEB3_PROVIDER))

def get_contract():
    web3 = get_web3()
    return web3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

def get_account():
    web3 = get_web3()
    account = web3.eth.account.from_key(PRIVATE_KEY)
    return account

def send_transaction(tx_function, *args):
    web3 = get_web3()
    account = get_account()
    
    try:
        tx = tx_function(*args).build_transaction({
            'from': account.address,
            'nonce': web3.eth.get_transaction_count(account.address),
            'gas': GAS_LIMIT,
            'gasPrice': web3.to_wei(GAS_PRICE, 'gwei')
        })
        
        signed_tx = web3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
        tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt
    except Exception as e:
        logger.error(f"Transaction failed: {str(e)}")
        raise

def upload_document_to_blockchain(user_address, ipfs_hash, document_type):
    """Upload document info to blockchain"""
    contract = get_contract()
    return send_transaction(contract.functions.uploadDocument, ipfs_hash, document_type)

def verify_document_on_blockchain(user_address, doc_index, status, notes):
    """Verify a document on the blockchain"""
    contract = get_contract()
    return send_transaction(contract.functions.verifyDocument, user_address, doc_index, status, notes)

class BlockchainManager:
    def __init__(self):
        self.web3_provider = os.getenv('WEB3_PROVIDER', 'http://localhost:7545')
        self.contract_address = os.getenv('CONTRACT_ADDRESS')
        self.private_key = os.getenv('ETHEREUM_PRIVATE_KEY')
        self.gas_limit = int(os.getenv('GAS_LIMIT', 2000000))
        self.gas_price = int(os.getenv('GAS_PRICE', 50))  # in gwei
        
        # Load contract ABI
        contract_json_path = os.getenv('CONTRACT_ABI_PATH', os.path.join(os.path.dirname(__file__), 'IdentityVerification.json'))
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
    
    def send_transaction(self, tx_function, *args):
        try:
            tx = tx_function(*args).build_transaction({
                'from': self.account.address,
                'nonce': self.web3.eth.get_transaction_count(self.account.address),
                'gas': self.gas_limit,
                'gasPrice': self.web3.to_wei(self.gas_price, 'gwei')
            })
            
            signed_tx = self.web3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
            return self.web3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            logger.error(f"Transaction failed: {str(e)}")
            raise
    
    def upload_document(self, document_hash, document_type, user_address=None):
        address_to_use = user_address if user_address else self.account.address
        return self.send_transaction(self.contract.functions.uploadDocument, document_hash, document_type)
    
    def verify_document(self, user_address, doc_index, status, notes):
        return self.send_transaction(self.contract.functions.verifyDocument, user_address, doc_index, status, notes)
    
    # Other methods remain unchanged...