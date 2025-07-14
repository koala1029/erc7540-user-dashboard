
import React, { useState } from 'react';
import Header from '@/components/Header';
import VaultList from '@/components/VaultList';
import VaultDetails from '@/components/VaultDetails';

type ViewType = 'vaults' | 'vault-details';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>('vaults');
  const [selectedVaultId, setSelectedVaultId] = useState<string>('');
  const [lockDuration, setLockDuration] = useState<string>('');

  const handleVaultSelect = (vaultId: string, duration: string) => {
    setSelectedVaultId(vaultId);
    setLockDuration(duration);
    setCurrentView('vault-details');
  };

  const handleBackToVaults = () => {
    setCurrentView('vaults');
    setSelectedVaultId('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {currentView === 'vaults' && (
          <VaultList onVaultSelect={handleVaultSelect} />
        )}
        
        {currentView === 'vault-details' && selectedVaultId && (
          <VaultDetails 
            vaultId={selectedVaultId} 
            lockDuration={lockDuration}
            onBack={handleBackToVaults}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
