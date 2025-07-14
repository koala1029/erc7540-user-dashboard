
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { 
  VaultRequest, 
  RequestType, 
  RequestStatus, 
  VaultService 
} from '@/utils/erc7540';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface RequestManagerProps {
  onBack: () => void;
}

const ITEMS_PER_PAGE = 5;

const RequestManager: React.FC<RequestManagerProps> = ({ onBack }) => {
  const { account, signer } = useWallet();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState<VaultRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<VaultRequest[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [vaultService, setVaultService] = useState<VaultService | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    if (signer) {
      setVaultService(new VaultService(signer));
    }
  }, [signer]);

  useEffect(() => {
    if (account) {
      // Load mock data - replace with real contract queries
      const mockRequests = generateMockRequests(account);
      setRequests(mockRequests);
    }
  }, [account]);

  // Apply filters
  useEffect(() => {
    let filtered = [...requests];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.id.includes(searchTerm) || 
        req.txHash?.includes(searchTerm) ||
        req.amount.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(req => req.type === typeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      
      filtered = filtered.filter(req => {
        switch (dateFilter) {
          case '1d':
            return now - req.timestamp < dayMs;
          case '7d':
            return now - req.timestamp < 7 * dayMs;
          case '30d':
            return now - req.timestamp < 30 * dayMs;
          default:
            return true;
        }
      });
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [requests, searchTerm, statusFilter, typeFilter, dateFilter]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case RequestStatus.APPROVED:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case RequestStatus.FINALIZED:
        return 'bg-green-100 text-green-800 border-green-200';
      case RequestStatus.REJECTED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: RequestType) => {
    return type === RequestType.DEPOSIT ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const handleFinalize = async (request: VaultRequest) => {
    if (!vaultService) return;

    setIsLoading(true);
    try {
      let tx;
      
      if (request.type === RequestType.DEPOSIT) {
        // Finalize deposit
        tx = await vaultService.finalizeDeposit(request.amount);
        toast({
          title: "Deposit Finalization Started",
          description: `Finalizing deposit of ${request.amount} assets`,
        });
      } else {
        // Finalize redeem
        tx = await vaultService.finalizeRedeem(request.amount);
        toast({
          title: "Redeem Finalization Started", 
          description: `Finalizing redeem of ${request.amount} shares`,
        });
      }

      await tx.wait();
      
      // Update request status (in real app, this would come from contract events)
      setRequests(prev => prev.map(req => 
        req.id === request.id 
          ? { ...req, status: RequestStatus.FINALIZED, finalizeTxHash: tx.hash }
          : req
      ));

      toast({
        title: "Request Finalized Successfully",
        description: `${request.type} request has been completed`,
      });

    } catch (error: any) {
      console.error('Finalization error:', error);
      toast({
        title: "Finalization Failed",
        description: "An error occurred during finalization",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateHash = (hash: string | undefined) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Request Management</h1>
              <p className="text-muted-foreground">
                Monitor and manage your vault requests
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, hash, amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={RequestStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={RequestStatus.APPROVED}>Approved</SelectItem>
                    <SelectItem value={RequestStatus.FINALIZED}>Finalized</SelectItem>
                    <SelectItem value={RequestStatus.REJECTED}>Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={RequestType.DEPOSIT}>Deposit</SelectItem>
                    <SelectItem value={RequestType.REDEEM}>Redeem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="1d">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {paginatedRequests.length} of {filteredRequests.length} requests
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Total: {requests.length} requests
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request List */}
        <div className="space-y-4">
          {paginatedRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(request.type)}
                    <div>
                      <h3 className="font-semibold capitalize">
                        {request.type} Request #{request.id}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(request.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium">Amount</p>
                    <p className="text-lg font-semibold">
                      {parseFloat(request.amount).toFixed(4)} {request.type === RequestType.DEPOSIT ? 'USDC' : 'vUSDC'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Request Hash</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm">{truncateHash(request.txHash)}</code>
                      {request.txHash && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground cursor-pointer" />
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Finalize Hash</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm">{truncateHash(request.finalizeTxHash)}</code>
                      {request.finalizeTxHash && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground cursor-pointer" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  {request.status === RequestStatus.APPROVED && (
                    <Button
                      onClick={() => handleFinalize(request)}
                      disabled={isLoading}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                          Finalizing...
                        </>
                      ) : (
                        `Finalize ${request.type}`
                      )}
                    </Button>
                  )}
                  
                  {request.status === RequestStatus.PENDING && (
                    <Badge variant="outline" className="text-xs">
                      Waiting for approval
                    </Badge>
                  )}
                  
                  {request.status === RequestStatus.FINALIZED && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      Completed
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RequestManager;
