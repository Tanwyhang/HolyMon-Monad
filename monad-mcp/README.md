# Monad MCP Server

Model Context Protocol (MCP) server for interacting with the Monad Testnet blockchain.

## Features

### Account & Balance
- `get-mon-balance` - Get MON balance for an address

### Block Explorer
- `get-block-number` - Get current block number
- `get-block` - Get block details by block number or hash

### Transaction Queries
- `get-transaction` - Get transaction details by hash
- `get-transaction-receipt` - Get transaction receipt by hash

### Contract Interactions
- `read-contract` - Read data from a smart contract
- `get-code` - Get bytecode of a contract address

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Usage

```bash
npm start
```

## Configuration

The server connects to the Monad Testnet:
- Chain ID: 10143
- RPC: https://testnet-rpc.monad.xyz
- Explorer: https://testnet.monadexplorer.com
