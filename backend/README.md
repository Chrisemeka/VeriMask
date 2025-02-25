## Integration Guide for Django Backend

Create an additional section in your README.md file:

markdown
## Django Backend Integration

### Setup 

1. Install required packages:
   
   pip install web3 django-rest-framework python-dotenv ipfshttpclient
   

2. Create a Web3 utility in your Django project:

   Create a file `blockchain_utils.py`:

   python
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
   

3. Create Django models for storing document data:

   python
   # models.py
   from django.db import models
   from django.contrib.auth.models import User

   class Document(models.Model):
       STATUS_CHOICES = [
           ('Pending', 'Pending'),
           ('Verified', 'Verified'),
           ('Rejected', 'Rejected'),
       ]
       
       user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
       ipfs_hash = models.CharField(max_length=100)
       document_type = models.CharField(max_length=50)
       file_name = models.CharField(max_length=255)
       status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
       upload_date = models.DateTimeField(auto_now_add=True)
       verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_documents')
       verification_date = models.DateTimeField(null=True, blank=True)
       notes = models.TextField(blank=True)
       blockchain_index = models.IntegerField(null=True, blank=True)
       blockchain_tx_hash = models.CharField(max_length=100, blank=True)
       wallet_address = models.CharField(max_length=42, blank=True)
   

4. Example Django view for document uploads:

   python
   # views.py
   import ipfshttpclient
   from rest_framework.views import APIView
   from rest_framework.response import Response
   from rest_framework import status
   from .models import Document
   from .blockchain_utils import upload_document_to_blockchain

   class DocumentUploadView(APIView):
       def post(self, request):
           # Handle file upload
           file = request.FILES.get('file')
           if not file:
               return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
           
           document_type = request.data.get('document_type')
           user = request.user
           
           # Connect to IPFS
           client = ipfshttpclient.connect('/dns/ipfs.infura.io/tcp/5001/https')
           
           # Upload to IPFS
           ipfs_result = client.add(file.read())
           ipfs_hash = ipfs_result['Hash']
           
           # Create document in database
           document = Document.objects.create(
               user=user,
               ipfs_hash=ipfs_hash,
               document_type=document_type,
               file_name=file.name,
               wallet_address=user.profile.wallet_address  # Assuming you store wallet address in user profile
           )
           
           # Upload to blockchain
           try:
               tx_receipt = upload_document_to_blockchain(
                   user.profile.wallet_address,
                   ipfs_hash,
                   document_type
               )
               
               # Get document index from transaction logs
               # This requires parsing the event logs to find the document index
               log_data = contract.events.DocumentUploaded().process_receipt(tx_receipt)
               if log_data:
                   # Get document count to use as index
                   doc_count = contract.functions.getDocumentCount(user.profile.wallet_address).call() - 1
                   document.blockchain_index = doc_count
                   document.blockchain_tx_hash = tx_receipt['transactionHash'].hex()
                   document.save()
               
               return Response({
                   'message': 'Document uploaded successfully',
                   'document_id': document.id,
                   'ipfs_hash': ipfs_hash
               })
           except Exception as e:
               # Handle blockchain errors
               document.delete()  # Rollback if blockchain upload fails
               return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
   

5. Example verification view:

   python
   class DocumentVerificationView(APIView):
       def post(self, request, document_id):
           # Ensure user is an institution
           if not request.user.profile.is_institution:
               return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
           
           document = Document.objects.get(id=document_id)
           status_value = request.data.get('status')
           notes = request.data.get('notes', '')
           
           # Update document in database
           document.status = status_value
           document.verified_by = request.user
           document.verification_date = timezone.now()
           document.notes = notes
           document.save()
           
           # Update on blockchain
           try:
               verify_document_on_blockchain(
                   document.wallet_address,
                   document.blockchain_index,
                   status_value,
                   notes
               )
               return Response({'message': 'Document verified successfully'})
           except Exception as e:
               return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
   ```
```

## Rest of Your Blockchain Development

The good news is that your blockchain development can proceed as planned. The contract, testing, and deployment processes don't change! 

The main consideration for the Django integration is providing your teammate with:

1. The contract ABI (JSON interface) from the compiled contracts
2. The deployed contract address
3. Documentation on how to call contract functions from Python (as shown above)

Make sure to place your compiled contract JSON file in a location that can be accessed by the Django application when it's time to integrate.

## Local Development Workflow for Testing Integration

When it's time to test integration, you can:

1. Deploy your contract on Ganache
2. Share the contract address and ABI with your teammate
3. Have your teammate configure Django to connect to the same Ganache instance

You might want to set up a shared development environment where both the blockchain and Django components can be tested together.

This approach keeps your blockchain work separate but ensures it will be compatible with your teammate's Django backend when it's time to integrate them.