from django.utils import timezone
from django.shortcuts import render
import ipfshttpclient
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Document
from rest_framework.permissions import IsAuthenticated
from .blockchain_utils import upload_document_to_blockchain, verify_document_on_blockchain
from web3 import Web3
from .blockchain_utils import get_contract_instance, BlockchainManager


class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Check if file was uploaded
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        document_type = request.data.get('document_type')
        
        if not document_type:
            return Response({'error': 'Document type is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create IPFS client
        try:
            ipfs_client = ipfshttpclient.connect('/dns/ipfs.infura.io/tcp/5001/https')
            
            # Upload to IPFS
            ipfs_result = ipfs_client.add(file.read())
            ipfs_hash = ipfs_result['Hash']
            
            # Save to database
            document = Document.objects.create(
                user=request.user,
                ipfs_hash=ipfs_hash,
                document_type=document_type,
                file_name=file.name,
                status='Pending'
            )
            
            # Upload to blockchain
            blockchain = BlockchainManager()
            receipt = blockchain.upload_document(
                ipfs_hash,
                document_type,
                request.user.profile.wallet_address
            )
            
            # Save blockchain index and transaction hash
            document.blockchain_tx_hash = receipt.transactionHash.hex()
            document.blockchain_index = blockchain.get_document_count(request.user.profile.wallet_address) - 1
            document.save()
            
            return Response({
                'message': 'Document uploaded successfully',
                'document_id': document.id,
                'ipfs_hash': ipfs_hash
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DocumentVerificationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, document_id):
        # Check if user is an institution
        if not hasattr(request.user, 'profile') or not request.user.profile.is_institution:
            return Response({'error': 'Only institutions can verify documents'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        try:
            document = Document.objects.get(id=document_id)
        except Document.DoesNotExist:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
        
        status_value = request.data.get('status')
        if status_value not in ['Verified', 'Rejected']:
            return Response({'error': 'Invalid status. Must be Verified or Rejected'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        notes = request.data.get('notes', '')
        
        # Update database
        document.status = status_value
        document.verified_by = request.user
        document.verification_date = timezone.now()
        document.notes = notes
        document.save()
        
        # Update blockchain
        try:
            blockchain = BlockchainManager()
            receipt = blockchain.verify_document(
                document.user.profile.wallet_address,
                document.blockchain_index,
                status_value,
                notes
            )
            
            return Response({
                'message': 'Document verification updated successfully',
                'document_id': document.id,
                'status': status_value,
                'transaction_hash': receipt.transactionHash.hex()
            })
            
        except Exception as e:
            # Revert database changes if blockchain update fails
            document.status = 'Pending'
            document.verified_by = None
            document.verification_date = None
            document.notes = ''
            document.save()
            
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
