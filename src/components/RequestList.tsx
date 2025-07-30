
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { VaultRequest, RequestStatus, RequestType } from '@/utils/erc7540';
import { ArrowDownIcon, ArrowUpIcon, RefreshCw, ExternalLink, Search, Filter, Clock, CheckCircle, XCircle, AlertCircle, Zap, Eye } from 'lucide-react';
import { Tooltip } from 'react-tooltip'
import { formatDuration } from '@/utils/helper';


interface RequestListProps {
  requests: VaultRequest[];
  onFinalizeRequest: (request: VaultRequest) => void;
  isLoading: boolean;
  isContentLoading: boolean;
  vaultSymbol: string;
  assetSymbol: string;
}

const ITEMS_PER_PAGE = 10;

const RequestList: React.FC<RequestListProps> = ({ 
  requests, 
  onFinalizeRequest, 
  isLoading,
  isContentLoading,
  vaultSymbol,
  assetSymbol 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesType = typeFilter === 'all' || request.type === typeFilter;
      const matchesSearch = searchQuery === '' || 
        request.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.amount.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [requests, statusFilter, typeFilter, searchQuery]);

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case RequestStatus.APPROVED:
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case RequestStatus.FINALIZED:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case RequestStatus.REJECTED:
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return <Clock className="h-3 w-3" />;
      case RequestStatus.APPROVED:
        return <AlertCircle className="h-3 w-3" />;
      case RequestStatus.FINALIZED:
        return <CheckCircle className="h-3 w-3" />;
      case RequestStatus.REJECTED:
        return <XCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canFinalize = (request: VaultRequest) => {
    return request.status === RequestStatus.APPROVED;
  };

  const handleFinalizeRequest = async (request: VaultRequest) => {
    setProcessingRequest(request.requestId);
    try {
      await onFinalizeRequest(request);
    } finally {
      setProcessingRequest(null);
    }
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/30 to-muted/10">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <RefreshCw className="h-4 w-4 text-primary" />
            </div>
            Request History
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 self-start sm:ml-auto">
            {filteredRequests.length} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-border/50 bg-background/50 focus:bg-background focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] border-border/50 bg-background/50">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="finalized">Finalized</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px] border-border/50 bg-background/50">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposits</SelectItem>
              <SelectItem value="redeem">Redeems</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            Showing {paginatedRequests.length} of {filteredRequests.length} requests
          </span>
          {filteredRequests.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Finalized
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Approved
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                Pending
              </div>
            </div>
          )}
        </div>

        {/* Table - Desktop */}
        <div className="hidden lg:block rounded-lg border border-border/50 overflow-hidden bg-background/30">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold text-center min-w-[240px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.length == 0 ? (
                isContentLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="text-center py-12">
                        <div className="h-12 w-12 mx-auto mb-4 animate-spin border-4 border-muted-foreground border-t-transparent rounded-full" />
                        <h3 className="text-lg font-semibold mb-2">Loading requests...</h3>
                        <p className="text-muted-foreground">Please wait while we fetch your data</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <RefreshCw className="h-8 w-8 opacity-50" />
                        <p className="font-medium">No requests found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              ) : (
                paginatedRequests.map((request, index) => (
                  <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                     <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                          request.type === RequestType.DEPOSIT 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {request.type === RequestType.DEPOSIT ? (
                            <ArrowDownIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <ArrowUpIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <span className="capitalize font-medium">{request.type}</span>
                          <p className="text-xs text-muted-foreground">#{request.requestId.slice(0, 8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-semibold">{parseFloat(request.amount).toFixed(4)}</span>
                        <span className="text-muted-foreground ml-1 text-sm">
                          {request.type === RequestType.DEPOSIT ? assetSymbol : vaultSymbol}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={`${getStatusColor(request.status)} border font-medium min-w-[100px] justify-center`} variant="outline">
                        <div className={`my-anchor-element-${index} flex items-center gap-1`}>
                          {getStatusIcon(request.status)}
                          {request.status}
                        </div>
                        {request.status === RequestStatus.PENDING && (
                          <Tooltip
                            anchorSelect={`.my-anchor-element-${index}`}
                            place="top"
                          >
                            {(() => {
                              const secondsLeft = Math.max(
                                0,
                                (Number(request.endTimestamp) - Date.now()) / 1000
                              );
                              const durationStr = formatDuration(secondsLeft);
        
                              return durationStr == "0m"
                                ? "The request will be approved soon by the admin."
                                : `Please wait for about ${durationStr}. After that, the admin will be able to process your request.`;
                            })()}
                          </Tooltip>
                        )}

                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(request.timestamp)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        {canFinalize(request) && (
                          <Button
                            onClick={() => handleFinalizeRequest(request)}
                            disabled={isLoading || processingRequest === request.requestId}
                            size="sm"
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 min-w-[100px]"
                          >
                            {processingRequest === request.requestId ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                                Processing
                              </>
                            ) : (
                              <>
                                <Zap className="h-3 w-3 mr-1" />
                                Finalize
                              </>
                            )}
                          </Button>
                        )}
                        
                        {request.status === RequestStatus.FINALIZED && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800 min-w-[100px] justify-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                        
                        {request.status === RequestStatus.PENDING && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800 min-w-[100px] justify-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Waiting
                          </Badge>
                        )}
                        
                        {request.status === RequestStatus.REJECTED && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 min-w-[100px] justify-center">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejected
                          </Badge>
                        )}
                        
                        <div className="flex gap-1">
                          {/* {request.txHash && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://etherscan.io/tx/${request.txHash}`, '_blank')}
                              className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors group p-2"
                              title="View transaction"
                            >
                              <ExternalLink className="h-3 w-3 group-hover:scale-110 transition-transform" />
                            </Button>
                          )} */}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-muted/50 transition-colors group p-2"
                            title="View details"
                          >
                            <Eye className="h-3 w-3 group-hover:scale-110 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>  
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {paginatedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-8 w-8 opacity-50" />
                <p className="font-medium">No requests found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            </Card>
          ) : (
            paginatedRequests.map((request, index) => (
              <Card key={index} className="border-border/50">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                        request.type === RequestType.DEPOSIT 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        {request.type === RequestType.DEPOSIT ? (
                          <ArrowDownIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ArrowUpIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <span className="capitalize font-medium">{request.type}</span>
                        <p className="text-xs text-muted-foreground">#{request.requestId.slice(0, 8)}</p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(request.status)} border font-medium`} variant="outline">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        {request.status}
                      </div>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-semibold">
                        {parseFloat(request.amount).toFixed(4)} {request.type === RequestType.DEPOSIT ? assetSymbol : vaultSymbol}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{formatDate(request.timestamp)}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {canFinalize(request) && (
                      <Button
                        onClick={() => handleFinalizeRequest(request)}
                        disabled={isLoading || processingRequest === request.requestId}
                        size="sm"
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1"
                      >
                        {processingRequest === request.requestId ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                            Processing
                          </>
                        ) : (
                          <>
                            <Zap className="h-3 w-3 mr-1" />
                            Finalize
                          </>
                        )}
                      </Button>
                    )}
                    
                    {request.status === RequestStatus.FINALIZED && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800 flex-1 justify-center py-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                    
                    {request.status === RequestStatus.PENDING && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800 flex-1 justify-center py-2">
                        <Clock className="h-3 w-3 mr-1" />
                        Waiting
                      </Badge>
                    )}
                    
                    {request.status === RequestStatus.REJECTED && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 flex-1 justify-center py-2">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejected
                      </Badge>
                    )}
                    
                    <div className="flex gap-2">
                      {/* {request.txHash && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://etherscan.io/tx/${request.txHash}`, '_blank')}
                          className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors"
                          title="View transaction"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )} */}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-muted/50 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-muted/50'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer hover:bg-muted/50 data-[current=page]:bg-primary data-[current=page]:text-primary-foreground"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-muted/50'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestList;
