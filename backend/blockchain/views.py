from django.utils import timezone
from django.shortcuts import render, get_object_or_404
import logging
import ipfshttpclient
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .Serializer import UserProfileSerializer, DocumentSerializer
from .models import Document, VerificationRecord
from rest_framework.permissions import IsAuthenticated
from .blockchain_utils import upload_document_to_blockchain, verify_document_on_blockchain
from web3 import Web3
from .blockchain_utils import BlockchainManager
from django.db import transaction
from .permissions import IsInstitution
from django.http import JsonResponse
from web3 import Web3
from rest_framework.throttling import UserRateThrottle
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

# Configure logger
logger = logging.getLogger(__name__)

class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]  # Add rate limiting
    
    def post(self, request):
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        document_type = request.data.get('document_type')
        
        if not document_type:
            return Response({'error': 'Document type is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            ipfs_hash = self.upload_to_ipfs(file)
            document = self.create_document(request.user, ipfs_hash, document_type, file)
            receipt = self.upload_to_blockchain(request.user.profile.wallet_address, ipfs_hash, document_type)
            
            document.blockchain_tx_hash = receipt.transactionHash.hex()
            document.blockchain_index = BlockchainManager().get_document_count(request.user.profile.wallet_address) - 1
            document.save()
            
            return Response({
                'message': 'Document uploaded successfully',
                'document_id': document.id,
                'ipfs_hash': ipfs_hash
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Document upload failed: {str(e)}")
            return Response({'error': 'Failed to upload document. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def upload_to_ipfs(self, file):
        ipfs_client = ipfshttpclient.connect('/dns/ipfs.infura.io/tcp/5001/https')
        ipfs_result = ipfs_client.add(file.read())
        return ipfs_result['Hash']
    
    def create_document(self, user, ipfs_hash, document_type, file):
        return Document.objects.create(
            user=user,
            ipfs_hash=ipfs_hash,
            document_type=document_type,
            file_name=file.name,
            file_size=file.size,
            status='Pending'
        )
    
    def upload_to_blockchain(self, wallet_address, ipfs_hash, document_type):
        blockchain = BlockchainManager()
        return blockchain.upload_document(ipfs_hash, document_type, wallet_address)

class DocumentVerificationView(APIView):
    permission_classes = [IsAuthenticated, IsInstitution]
    
    def post(self, request, document_id):
        try:
            document = get_object_or_404(Document, id=document_id)
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
            
            # Create a verification record
            VerificationRecord.objects.create(
                document=document,
                verifier=request.user,
                status_change=status_value,
                notes=notes,
                transaction_hash=receipt.transactionHash.hex()
            )
            
            # Send WebSocket notification
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{document.user.id}",  # Group name (user-specific)
                {
                    'type': 'send_notification',
                    'message': f"Your document '{document.file_name}' has been {document.status.lower()}."
                }
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
            
            logger.error(f"Blockchain verification failed: {str(e)}")
            return Response({'error': 'Failed to update blockchain. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PendingDocumentsView(APIView):
    permission_classes = [IsAuthenticated, IsInstitution]
    
    def get(self, request):
        documents = Document.objects.filter(status='Pending')
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)
    
class DocumentDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, document_id):
        document = Document.objects.get(id=document_id, user=request.user)
        serializer = DocumentSerializer(document)
        return Response(serializer.data)
    
class DocumentSearchView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('query', '')
        documents = Document.objects.filter(user=request.user, file_name__icontains=query)
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)
        
class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
        profile = request.user.profile
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class VerificationHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        documents = Document.objects.filter(user=request.user).exclude(status='Pending')
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)
    
class VerifySignatureView(APIView):
    def post(self, request):
        user_address = request.data.get('user_address')
        signature = request.data.get('signature')
        message = "Please sign this message to authenticate."
        
        if not user_address or not signature:
            return Response({'error': 'User address and signature are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            web3 = Web3(Web3.HTTPProvider('http://localhost:7545'))
            recovered_address = web3.eth.account.recover_message(text=message, signature=signature)
            
            if recovered_address.lower() == user_address.lower():
                # Authenticate the user (e.g., generate JWT token)
                return Response({'status': 'success', 'token': 'your_jwt_token'})
            else:
                return Response({'status': 'error', 'message': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Signature verification failed: {str(e)}")
            return Response({'error': 'Failed to verify signature. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class UserDocumentsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        documents = Document.objects.filter(user=request.user)
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)