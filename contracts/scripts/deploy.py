"""
Deployment script for HolyMon smart contracts
Run with: ape run deploy --network <network_name>
"""

from ape import accounts, project
import os
from dotenv import load_dotenv
from ape.api import Account
from eth_account import Account as EthAccount

# Load environment variables from .env file
load_dotenv()

def main():
    # For Monad testnet deployment
    is_testnet = os.getenv("MONAD_TESTNET_PRIVATE_KEY") is not None
    
    if is_testnet:
        private_key = os.getenv("MONAD_TESTNET_PRIVATE_KEY")
        # Create an Ape account from private key
        eth_account = EthAccount.from_key(private_key)
        deployer = Account(private_key=private_key)
        print(f"Deploying to Monad testnet from account: {eth_account.address}")
    else:
        # Use test account for local development
        deployer = accounts.test_accounts[0]
        print(f"Deploying locally from account: {deployer.address}")
    
    print(f"Network: custom connection")
    
    # Deploy TokenLaunchpad with zero address (no AgentRegistry dependency)
    print("\nDeploying TokenLaunchpad...")
    token_launchpad = project.TokenLaunchpad.deploy(
        "0x0000000000000000000000000000000000000000",  # No AgentRegistry dependency
        sender=deployer
    )
    print(f"TokenLaunchpad deployed at: {token_launchpad.address}")
    
    # Deploy MONStaking
    print("\nDeploying MONStaking...")
    mon_staking = project.MONStaking.deploy(sender=deployer)
    print(f"MONStaking deployed at: {mon_staking.address}")
    
    # Print deployment summary
    print("\n" + "="*50)
    print("DEPLOYMENT SUMMARY")
    print("="*50)
    print(f"TokenLaunchpad: {token_launchpad.address}")
    print(f"MONStaking: {mon_staking.address}")
    print("="*50)
    
    # Save addresses for backend integration
    with open("deployed_addresses.txt", "w") as f:
        f.write(f"TOKEN_LAUNCHPAD_ADDRESS={token_launchpad.address}\n")
        f.write(f"MON_STAKING_ADDRESS={mon_staking.address}\n")
    
    print("\nAddresses saved to deployed_addresses.txt")
    
    return {
        "token_launchpad": token_launchpad.address,
        "mon_staking": mon_staking.address,
    }