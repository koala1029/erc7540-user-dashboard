
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { VaultService, VaultRequest, RequestStatus, RequestType } from '@/utils/erc7540';
import { ArrowLeft, ArrowDownIcon, ArrowUpIcon, RefreshCw, TrendingUp, Users, DollarSign, Vault } from 'lucide-react';
import RequestList from './RequestList';
import { ethers } from 'ethers';
import { INVESTMENT_MANAGER, POOL_MANAGER, RPC_PROVIDER } from '@/utils/constants';
import { poolManager_abi } from '@/abis/poolManager_abi';
import { InvestmentManager_abi } from '@/abis/InvestmentManager_abi';
import { token_abi } from '@/abis/token_abi';
import { ERC7540Vault_abi } from '@/abis/eRC7540Vault_abi';
import { delay, formatDuration } from '@/utils/helper';
interface VaultDetailsProps {
  vaultId: string;
  lockDuration: string;
  onBack: () => void;
}

interface Vault {
  name: string;
  symbol: string;
  tvl: string;
  apy: string;
  totalUsers: number;
  description: string;
  assetSymbol: string;
  assetAddress: string;
  shareAddress: string;
}
const VaultDetails: React.FC<VaultDetailsProps> = ({ vaultId, lockDuration, onBack }) => {
  const { signer, account, isConnected, provider } = useWallet();
  const [vaultInfo, setVaultInfo] = useState<Vault>({
    name: "",
    symbol: "",
    tvl: "0",
    apy: "0",
    totalUsers: 0,
    description: "",
    assetSymbol: "",
    assetAddress: "",
    shareAddress: ""
  });
  const { toast } = useToast();
  
  const [assetBalance, setAssetBalance] = useState('0.00');
  const [shareBalance, setShareBalance] = useState('0.00');
  const [depositAmount, setDepositAmount] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [requests, setRequests] = useState<VaultRequest[]>([]);
  const [vaultService, setVaultService] = useState<VaultService | null>(null);
  const [vaultAddress, setVaultAddress] = useState("");
  const [assetAddress, setAssetAddress] = useState("");
  const [shareAddress, setShareAddress] = useState("");
  // const [lockDuration, setLockDuration] = useState("");

  const [isDepositing, setIsDepositing] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);



  const getVaultList = async () => {
    try {
      setIsContentLoading(true);
      const rpc_provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER);
      const poolManagerContract = new ethers.Contract(POOL_MANAGER, poolManager_abi, rpc_provider);
      const investmentManagerContract = new ethers.Contract(INVESTMENT_MANAGER, InvestmentManager_abi, rpc_provider);

      const vaults: any[] = await poolManagerContract.getAllVaults();
      for(let i = 0; i < vaults.length; i++) {
        if(Number(vaults[i].vaultId).toString() == vaultId) {
          const vaultContract = new ethers.Contract(vaults[i].vaultAddress, ERC7540Vault_abi, rpc_provider);
          const duration = Number(await vaultContract.timeLockPeriod());
          // setLockDuration(formatDuration(duration));
          setVaultAddress(vaults[i].vaultAddress);
          setAssetAddress(vaults[i].asset);
          setShareAddress(vaults[i].share);

          const shareContract = new ethers.Contract(vaults[i].share, token_abi, rpc_provider);
          const assetContract = new ethers.Contract(vaults[i].asset, token_abi, rpc_provider);

          const [name, symbol, a_name, a_symbol, state, a_decimal, s_decimal, a_balance, s_balance] = await Promise.all([
            shareContract.name(),
            shareContract.symbol(),
            assetContract.name(),
            assetContract.symbol(),
            investmentManagerContract.vaultStates(vaults[i].vaultAddress),
            assetContract.decimals(),
            shareContract.decimals(),
            assetContract.balanceOf(account),
            shareContract.balanceOf(account)
          ]);

          let amount = (Number(a_balance) / (10 ** a_decimal)).toFixed(2);
          setAssetBalance(amount.toString());
          amount = (Number(s_balance) / (10 ** s_decimal)).toFixed(2);
          setShareBalance(amount.toString());


          const info = {
            name: name,
            symbol: symbol,
            tvl: (Number(state.totalAssets) / (10 ** a_decimal)).toString(),
            apy: '10',
            totalUsers: 100,
            description: 'Stable yield farming with USDC deposits',
            assetSymbol: a_symbol,
            assetAddress: vaults[i].asset,
            shareAddress: vaults[i].share,
          }

          setVaultInfo(info);

          const depositRequestList = await investmentManagerContract.getDepositRequestsByUser(vaults[i].vaultAddress, account);
          const redeemRequestList = await investmentManagerContract.getRedeemRequestsByUser(vaults[i].vaultAddress, account);

          let items: VaultRequest[] = [];
          for(let i = 0; i < depositRequestList.length; i++) {
            const item: VaultRequest = {
                requestId: Number(depositRequestList[i].requestId).toString(),
                type: RequestType.DEPOSIT,
                amount: (Number(depositRequestList[i].assets)/(10 ** a_decimal)).toString(),
                status: depositRequestList[i].processed ? RequestStatus.FINALIZED : depositRequestList[i].claimable ? RequestStatus.APPROVED : RequestStatus.PENDING,
                timestamp: Number(depositRequestList[i].requestedAt) * 1000,
                endTimestamp: (Number(depositRequestList[i].requestedAt) + Number(depositRequestList[i].duration)) * 1000,
                user: depositRequestList[i].controller,
                txHash: "",
                approvalTxHash: "",
                finalizeTxHash: "",
            }
            items.push(item);
          }

          for(let i = 0; i < redeemRequestList.length; i++) {
            const item: VaultRequest = {
                requestId: Number(redeemRequestList[i].requestId).toString(),
                type: RequestType.REDEEM,
                amount: (Number(redeemRequestList[i].shares)/(10 ** s_decimal)).toString(),
                status: redeemRequestList[i].processed ? RequestStatus.FINALIZED : redeemRequestList[i].claimable ? RequestStatus.APPROVED : RequestStatus.PENDING,
                timestamp: Number(redeemRequestList[i].requestedAt) * 1000,
                endTimestamp: (Number(redeemRequestList[i].requestedAt) + Number(redeemRequestList[i].duration)) * 1000,
                user: redeemRequestList[i].controller,
                txHash: "",
                approvalTxHash: "",
                finalizeTxHash: "",
            }
            items.push(item);
          }
          setRequests(items)
          setIsContentLoading(false);
        }
      }
    } catch (error) {
      setIsContentLoading(false);
      console.error("Error fetching vaults:", error);
    }
  };
  useEffect(() => {
    if (signer && vaultAddress && assetAddress) {
      setVaultService(new VaultService(signer, vaultAddress, assetAddress, shareAddress));
    }
    getVaultList();
  }, [signer, vaultAddress, assetAddress]);

  useEffect(() => {
    getVaultList();
  }, [])

  useEffect(() => {
    if (account && isConnected) {
      // Load mock requests
      // const mockRequests = generateMockRequests(account);
      // setRequests(mockRequests);
    }
  }, [account, isConnected]);

  const handleDepositRequest = async () => {
    if (!vaultService || !depositAmount) return;
    const vaultContract = new ethers.Contract(vaultAddress, ERC7540Vault_abi, provider);
  
    setIsDepositing(true);
    try {

      const approveTx = await vaultService.approveAsset(depositAmount);
      await approveTx.wait();

      const requestTx = await vaultService.requestDeposit(depositAmount);
      toast({
        title: "Deposit Request Created",
        description: `Request for ${depositAmount} ${vaultInfo.assetSymbol} submitted`,
      });

      setAssetBalance((Number(assetBalance) - Number(depositAmount)).toString());
      
      const requestId = Number(await vaultContract.nextDepositRequestId()) + 1;
      const duration = Number(await vaultContract.timeLockPeriod()) * 1000;
      // Add new request to list
      const newRequest: VaultRequest = {
        requestId: requestId.toString(),
        type: RequestType.DEPOSIT,
        amount: depositAmount,
        status: RequestStatus.PENDING,
        timestamp: Date.now(),
        endTimestamp: Date.now() + duration,
        user: account!,
        txHash: requestTx.hash
      };
      
      setRequests(prev => [newRequest, ...prev]);
      setDepositAmount('');
      setAssetBalance((Number(assetBalance) - Number(depositAmount)).toString());
      
    } catch (error: any) {
      console.error('Deposit request error:', error);
      toast({
        title: "Request Failed",
        description: "Failed to create deposit request",
        variant: "destructive",
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleRedeemRequest = async () => {
    if (!vaultService || !redeemAmount) return;
    const vaultContract = new ethers.Contract(vaultAddress, ERC7540Vault_abi, provider);
    
    setIsRedeeming(true);
    try {
      const approveTx = await vaultService.approveShare(redeemAmount);
      await approveTx.wait();
      const requestTx = await vaultService.requestRedeem(redeemAmount);
      toast({
        title: "Redeem Request Created",
        description: `Request to redeem ${redeemAmount} ${vaultInfo.symbol} submitted`,
      });

      setShareBalance((Number(shareBalance) - Number(redeemAmount)).toString());
      const requestId = Number(await vaultContract.nextRedeemRequestId()) + 1;
      const duration = Number(await vaultContract.timeLockPeriod()) * 1000;
      // Add new request to list
      const newRequest: VaultRequest = {
        requestId: requestId.toString(),
        type: RequestType.REDEEM,
        amount: redeemAmount,
        status: RequestStatus.PENDING,
        timestamp: Date.now(),
        endTimestamp: Date.now() + duration,
        user: account!,
        txHash: ""
      };
      
      setRequests(prev => [newRequest, ...prev]);
      setRedeemAmount('');
      
    } catch (error: any) {
      console.error('Redeem request error:', error);
      toast({
        title: "Request Failed",
        description: "Failed to create redeem request",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleFinalizeRequest = async (request: VaultRequest) => {
    if (!vaultService) return;

    setIsLoading(true);
    try {
      let finalizeTx;
      
      if (request.type === RequestType.DEPOSIT) {
        finalizeTx = await vaultService.finalizeDeposit(request.requestId);
        await finalizeTx.wait();
        await delay(1000);
        await getVaultList();
        toast({
          title: "Deposit Finalized", 
          description: `Deposit of ${request.amount} ${vaultInfo.assetSymbol} completed!`,
        });
      } else {
        // For redeems: just finalize
        finalizeTx = await vaultService.finalizeRedeem(request.requestId);
        await finalizeTx.wait();
        await delay(1000);
        await getVaultList();
        toast({
          title: "Redeem Finalized",
          description: `Redeemed ${request.amount} ${vaultInfo.symbol} successfully!`,
        });
      }
      // Update request status
      setRequests(prev => prev.map(r => 
        r.requestId === request.requestId 
          ? { ...r, status: RequestStatus.FINALIZED, finalizeTxHash: finalizeTx.hash }
          : r
      ));
    } catch (error: any) {
      console.error('Finalize error:', error);
      toast({
        title: "Finalization Failed",
        description: "Failed to finalize request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Connect Wallet Required</CardTitle>
            <CardDescription>
              Please connect your wallet to access vault details
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Vaults
      </Button>

      {/* Vault Info Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl sm:text-2xl">{vaultInfo.name}</CardTitle>
              <CardDescription className="mt-2">{vaultInfo.description}</CardDescription>
            </div>
            <Badge variant="secondary" className="self-start">{vaultInfo.symbol}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Value Locked</p>
                <p className="text-lg sm:text-xl font-semibold truncate">${vaultInfo.tvl}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">APY</p>
                <p className="text-lg sm:text-xl font-semibold text-green-600 truncate">{vaultInfo.apy}%</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:col-span-2 lg:col-span-1">
              <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-lg sm:text-xl font-semibold truncate">{vaultInfo.totalUsers}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg text-emerald-700 dark:text-emerald-300">
              {vaultInfo.assetSymbol} Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-emerald-800 dark:text-emerald-200">
              {parseFloat(assetBalance).toFixed(2)} {vaultInfo.assetSymbol}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              Available for deposit
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 border-indigo-200 dark:border-indigo-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg text-indigo-700 dark:text-indigo-300">
              Vault Shares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-indigo-800 dark:text-indigo-200">
              {parseFloat(shareBalance).toFixed(4)} {vaultInfo.symbol}
            </div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
              Available for redemption
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Deposit Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ArrowDownIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
              Deposit {vaultInfo.assetSymbol}
            </CardTitle>
            <CardDescription>
              Create a deposit request to receive vault shares
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount ({vaultInfo.assetSymbol})</label>
              <Input
                type="number"
                placeholder="Enter amount to deposit"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={isDepositing}
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleDepositRequest}
              disabled={!depositAmount || isDepositing}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isDepositing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating Request...
                </>
              ) : (
                'Create Deposit Request'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Redeem Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ArrowUpIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
              Redeem Shares
            </CardTitle>
            <CardDescription>
              Create a redeem request to receive underlying assets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount ({vaultInfo.symbol})</label>
              <Input
                type="number"
                placeholder="Enter shares to redeem"
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                disabled={isRedeeming}
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleRedeemRequest}
              disabled={!redeemAmount || isRedeeming}
              className="w-full bg-red-600 hover:bg-red-700"
              variant="destructive"
            >
              {isRedeeming ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating Request...
                </>
              ) : (
                'Create Redeem Request'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 border rounded text-md mt-4 flex gap-3">
        <div><span className="text-yellow-500 text-3xl">⚠️</span></div>
        By depositing funds into this vault I accept that I am committing to a time lock for a duration of { lockDuration }, during this time I will not have access to withdraw funds.
        <br />After the time lock period is over funds may be withdrawn to the wallet holding the correct vault share tokens
      </div>


      {/* Request List */}
      <RequestList 
        requests={requests}
        onFinalizeRequest={handleFinalizeRequest}
        isLoading={isLoading}
        isContentLoading = {isContentLoading}
        vaultSymbol={vaultInfo.symbol}
        assetSymbol={vaultInfo.assetSymbol}
      />
    </div>
  );
};

export default VaultDetails;
