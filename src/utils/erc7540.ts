import { ERC7540Vault_abi } from '@/abis/eRC7540Vault_abi';
import { token_abi } from '@/abis/token_abi';
import { ethers } from 'ethers';

// ERC7540 Request Status enum
export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  FINALIZED = 'finalized',
  REJECTED = 'rejected'
}

export enum RequestType {
  DEPOSIT = 'deposit',
  REDEEM = 'redeem'
}

export interface VaultRequest {
  requestId: string;
  type: RequestType;
  amount: string;
  status: RequestStatus;
  timestamp: number;
  endTimestamp: number;
  user: string;
  txHash?: string;
  approvalTxHash?: string;
  finalizeTxHash?: string;
}

export class VaultService {
  private vaultContract: ethers.Contract;
  private assetContract: ethers.Contract;
  private shareContract: ethers.Contract;
  private signer: ethers.Signer;
  private VAULT_ADDRESS: string;
  private ASSET_ADDRESS: string;
  private SHARE_ADDRESS: string;



  constructor(signer: ethers.Signer, VAULT_ADDRESS: string, ASSET_ADDRESS: string, SHARE_ADDRESS: string) {
    this.signer = signer;
    this.vaultContract = new ethers.Contract(VAULT_ADDRESS, ERC7540Vault_abi, signer);
    this.assetContract = new ethers.Contract(ASSET_ADDRESS, token_abi, signer);
    this.shareContract = new ethers.Contract(SHARE_ADDRESS, token_abi, signer);

    this.VAULT_ADDRESS = VAULT_ADDRESS;
    this.ASSET_ADDRESS = ASSET_ADDRESS;
    this.SHARE_ADDRESS = SHARE_ADDRESS;
  }

  // Deposit Flow Functions
  async requestDeposit(amount: string): Promise<ethers.ContractTransaction> {
    const assets = ethers.utils.parseEther(amount);
    const userAddress = await this.signer.getAddress();
    
    console.log(`Requesting deposit of ${amount} assets for ${userAddress}`);
    return await this.vaultContract.requestDeposit(assets, userAddress, userAddress);
  }

  async approveAsset(amount: string): Promise<ethers.ContractTransaction> {
    const assets = ethers.utils.parseEther(amount);
    console.log(`Approving ${amount} assets for vault`);
    return await this.assetContract.approve(this.VAULT_ADDRESS, assets);
  }

  async approveShare(amount: string): Promise<ethers.ContractTransaction> {
    const shares = ethers.utils.parseEther(amount);
    console.log(`Approving ${amount} shares for vault`);
    return await this.shareContract.approve(this.VAULT_ADDRESS, shares);
  }

  async finalizeDeposit(requestId: string): Promise<ethers.ContractTransaction> {
    const userAddress = await this.signer.getAddress();
    console.log(`Finalizing deposit  id: ${requestId}`);
    return await this.vaultContract.deposit(userAddress, userAddress, requestId);
  }

  // Redeem Flow Functions
  async requestRedeem(amount: string): Promise<ethers.ContractTransaction> {
    const shares = ethers.utils.parseEther(amount);
    const userAddress = await this.signer.getAddress();
    
    console.log(`Requesting redeem of ${amount} shares for ${userAddress}`);
    return await this.vaultContract.requestRedeem(shares, userAddress, userAddress);
  }

  async finalizeRedeem(requestId: string): Promise<ethers.ContractTransaction> {
    const userAddress = await this.signer.getAddress();
    
    console.log(`Finalizing redeem of id ${requestId}`);
    return await this.vaultContract.redeem(userAddress, userAddress, requestId);
  }

  // Balance queries
  async getAssetBalance(): Promise<string> {
    const userAddress = await this.signer.getAddress();
    const balance = await this.assetContract.balanceOf(userAddress);
    return ethers.utils.formatEther(balance);
  }

  async getVaultShareBalance(): Promise<string> {
    const userAddress = await this.signer.getAddress();
    const balance = await this.vaultContract.balanceOf(userAddress);
    return ethers.utils.formatEther(balance);
  }

  async getAssetAllowance(): Promise<string> {
    const userAddress = await this.signer.getAddress();
    const allowance = await this.assetContract.allowance(userAddress, this.VAULT_ADDRESS);
    return ethers.utils.formatEther(allowance);
  }

  async getID(option: boolean): Promise<number> {
    if(option) {
      return await this.vaultContract.nextRedeemRequestId();
    }  else {
      return await this.vaultContract.nextDepositRequestId();
    }
  }

  // Conversion utilities
  async convertToShares(assetAmount: string): Promise<string> {
    const assets = ethers.utils.parseEther(assetAmount);
    const shares = await this.vaultContract.convertToShares(assets);
    return ethers.utils.formatEther(shares);
  }

  async convertToAssets(shareAmount: string): Promise<string> {
    const shares = ethers.utils.parseEther(shareAmount);
    const assets = await this.vaultContract.convertToAssets(shares);
    return ethers.utils.formatEther(assets);
  }
}

// Mock data for demo purposes (replace with real contract queries)
// export const generateMockRequests = (userAddress: string): VaultRequest[] => {
//   const requests: VaultRequest[] = [];
//   const now = Date.now();
  
//   for (let i = 0; i < 25; i++) {
//     const isDeposit = Math.random() > 0.5;
//     const status = [RequestStatus.PENDING, RequestStatus.APPROVED, RequestStatus.FINALIZED][
//       Math.floor(Math.random() * 3)
//     ];
    
//     requests.push({
//       requestId: `${i + 1}`,
//       type: isDeposit ? RequestType.DEPOSIT : RequestType.REDEEM,
//       amount: (Math.random() * 1000 + 10).toFixed(2),
//       status,
//       timestamp: now - Math.random() * 7 * 24 * 60 * 60 * 1000, // Last 7 days
//       user: userAddress,
//       txHash: `0x${Math.random().toString(16).substr(2, 40)}`,
//       approvalTxHash: status !== RequestStatus.PENDING ? `0x${Math.random().toString(16).substr(2, 40)}` : undefined,
//       finalizeTxHash: status === RequestStatus.FINALIZED ? `0x${Math.random().toString(16).substr(2, 40)}` : undefined,
//     });
//   }
  
//   return requests.sort((a, b) => b.timestamp - a.timestamp);
// };
