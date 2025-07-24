
import React, { useEffect, useContext, useState  } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, DollarSign, Shield, Star, Zap, Timer } from 'lucide-react';
import { ethers } from "ethers";
import { useWallet } from "@/contexts/WalletContext";

import { token_abi } from '@/abis/token_abi';
import { poolManager_abi } from '@/abis/poolManager_abi';
import { INVESTMENT_MANAGER, POOL_MANAGER, RPC_PROVIDER } from '@/utils/constants';
import { InvestmentManager_abi } from '@/abis/InvestmentManager_abi';
import { ERC7540Vault_abi } from '@/abis/eRC7540Vault_abi';
import { formatDuration } from '@/utils/helper';
import Logo from '@/assets/Logo.png';
interface Vault {
  id: string;
  name: string;
  symbol: string;
  tvl: string;
  apy: string;
  totalUsers: number;
  description: string;
  category: string;
  timeLockPeriod: string;
}

interface VaultListProps {
  onVaultSelect: (vaultId: string, duration: string) => void;
}

const VaultList: React.FC<VaultListProps> = ({ onVaultSelect }) => {
  const {account, signer, chainId, provider} = useWallet();
  const [mockVaults, setMockVaults ] = useState<Vault[]>([])
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Stablecoin':
        return Shield;
      case 'DeFi':
        return Zap;
      case 'Crypto':
        return TrendingUp;
      case 'Diversified':
        return Star;
      default:
        return Shield;
    }
  };

  const getApyColor = (apy: string) => {
    const apyNum = parseFloat(apy);
    if (apyNum >= 15) return 'text-emerald-600 dark:text-emerald-400';
    if (apyNum >= 10) return 'text-blue-600 dark:text-blue-400';
    return 'text-primary';
  };

  const getVaultList = async () => {
    try {
      const rpc_provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER);
      
      const poolManagerContract = new ethers.Contract(POOL_MANAGER, poolManager_abi, rpc_provider);
      const investmentManagerContract = new ethers.Contract(INVESTMENT_MANAGER, InvestmentManager_abi, rpc_provider);

      const vaults: any[] = await poolManagerContract.getAllVaults();


      const vaultDataPromises = vaults.map(async (vault) => {
        const shareContract = new ethers.Contract(vault.share, token_abi, rpc_provider);
        const assetContract = new ethers.Contract(vault.asset, token_abi, rpc_provider);
        const vaultContract = new ethers.Contract(vault.vaultAddress, ERC7540Vault_abi, rpc_provider);
        const timeLockPeriod = await vaultContract.timeLockPeriod();


        const [name, symbol, state, decimals] = await Promise.all([
          shareContract.name(),
          shareContract.symbol(),
          investmentManagerContract.vaultStates(vault.vaultAddress),
          assetContract.decimals(),
        ]);

        return {
          id: Number(vault.vaultId).toString(),
          name,
          symbol,
          tvl: (Number(state.totalAssets) / (10 ** decimals)).toString(),
          apy: '10',
          totalUsers: 100,
          description: 'Diversified portfolio across multiple assets for balanced growth',
          category: 'Diversified',
          timeLockPeriod: (timeLockPeriod).toString()
        };
      });

      const vaultInfos: Vault[] = await Promise.all(vaultDataPromises);
      setMockVaults(vaultInfos);
    } catch (error) {
      console.error("Error fetching vaults:", error);
    }
  };


  useEffect(() => {
    getVaultList();
  }, [account, provider]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8 sm:mb-12 text-center">
        {/* <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 mb-4 sm:mb-6"> */}
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full mb-4 sm:mb-6">  
          <img src={Logo} />
          {/* <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" /> */}
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Available Vaults
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
          Choose from our selection of ERC7540-compliant vault strategies designed for optimal returns
        </p>
      </div>

       <div className="flex flex-wrap justify-center gap-4">
        {mockVaults.map((vault) => {
          const IconComponent = getCategoryIcon(vault.category);
          return (
            <Card key={vault.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/50 bg-gradient-to-br from-card to-card/50 overflow-hidden flex flex-col h-full">
              <CardHeader className="pb-4 relative flex-shrink-0">
                <div className="absolute top-4 right-4">
                  {/* <Badge className={`${getRiskColor(vault.riskLevel)} border text-xs font-medium`} variant="outline">
                    {vault.riskLevel} risk
                  </Badge> */}
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-colors flex-shrink-0">
                    <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors">{vault.name}</CardTitle>
                    <p className="text-sm text-muted-foreground font-mono">{vault.symbol}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 sm:space-y-6 flex-1 flex flex-col">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground leading-relaxed h-10 sm:h-12 overflow-hidden">{vault.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-muted-foreground font-medium">
                      <DollarSign className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">TOTAL VALUE LOCKED</span>
                    </div>
                    <p className="font-bold text-base sm:text-lg truncate">${vault.tvl}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-muted-foreground font-medium">
                      <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">ANNUAL YIELD</span>
                    </div>
                    <p className={`font-bold text-base sm:text-lg ${getApyColor(vault.apy)}`}>{vault.apy}%</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-muted-foreground font-medium">
                      <Timer className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">Vault Lock Period</span>
                    </div>
                    <p className="font-bold text-base sm:text-lg truncate">{formatDuration(Number(vault.timeLockPeriod))}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{vault.totalUsers.toLocaleString()} users</span>
                  </div>
                  
                  <Badge variant="outline" className="text-xs border-primary/20 text-primary bg-primary/5 flex-shrink-0">
                    {vault.category}
                  </Badge>
                </div>
                
                <Button 
                  onClick={() => onVaultSelect(vault.id, formatDuration(Number(vault.timeLockPeriod)))}
                  className="w-full group-hover:bg-primary/90 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 mt-auto"
                >
                  Enter Vault
                </Button>
              </CardContent>
            </Card>
          );
        })}
      {/* </div> */}
      </div>
    </div>
  );
};

export default VaultList;
