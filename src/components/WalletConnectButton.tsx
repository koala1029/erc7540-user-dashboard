
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/contexts/WalletContext';
import { Wallet, LogOut, AlertCircle, RefreshCw, Shield, CheckCircle } from 'lucide-react';

const WalletConnectButton: React.FC = () => {
  const { account, isConnected, isConnecting, error, connect, disconnect, chainId } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId: number | null) => {
    switch (chainId) {
      case 1:
        return 'Ethereum Mainnet';
      case 5:
        return 'Goerli Testnet';
      case 137:
        return 'Polygon';
      case 80001:
        return 'Mumbai Testnet';
      default:
        return `Chain ID: ${chainId}`;
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto border-border/50 bg-gradient-to-br from-card to-card/50 shadow-xl">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Connect your MetaMask wallet to access the ERC7540 vault features and start earning yield
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <Button 
            onClick={connect} 
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Connect MetaMask
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <Shield className="h-3 w-3 inline mr-1" />
            Make sure you have MetaMask installed and unlocked
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border-border/50 bg-gradient-to-br from-card to-card/50 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/10">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold">{formatAddress(account!)}</p>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-primary/20 text-primary bg-primary/5">
                  {getNetworkName(chainId)}
                </Badge>
              </div>
            </div>
          </div>
          
          <Button
            onClick={disconnect}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletConnectButton;
