import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createPublicClient, http, formatUnits, parseAbi } from "viem";
import { defineChain } from "viem";

const monadTestnet = defineChain({
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://testnet-rpc.monad.xyz'] },
    },
    blockExplorers: {
        default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
    },
});

const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http()
});

const server = new McpServer({
  name: "monad-mcp",
  version: "1.0.0"
});

// Add the get-mon-balance tool
server.tool(
    "get-mon-balance",
    "Get MON balance for an address on Monad testnet",
    {
        address: z.string().describe("Monad testnet address to check balance for"),
    },
    async ({ address }) => {
        try {
            const balance = await publicClient.getBalance({
                address: address as `0x${string}`,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `Balance for ${address}: ${formatUnits(balance, 18)} MON`,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to retrieve balance for address: ${address}. Error: ${
                        error instanceof Error ? error.message : String(error)
                        }`,
                    },
                ],
            };
        }
    }
);

server.tool(
    "get-block-number",
    "Get current block number on Monad testnet",
    {},
    async () => {
        try {
            const blockNumber = await publicClient.getBlockNumber();
            return {
                content: [
                    {
                        type: "text",
                        text: `Current block number: ${blockNumber.toString()}`,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to get block number. Error: ${
                        error instanceof Error ? error.message : String(error)
                        }`,
                    },
                ],
            };
        }
    }
);

server.tool(
    "get-block",
    "Get block details by block number or hash on Monad testnet",
    {
        blockNumber: z.string().optional().describe("Block number as hex (e.g., '0x123')"),
        blockHash: z.string().optional().describe("Block hash"),
    },
    async ({ blockNumber, blockHash }) => {
        try {
            let params: any = {};
            if (blockHash) {
                params.blockHash = blockHash as `0x${string}`;
            } else if (blockNumber) {
                params.blockNumber = blockNumber as `0x${string}`;
            }
            const block = await publicClient.getBlock(params);
            return {
                content: [
                    {
                        type: "text",
                        text: `Block ${block?.number}\n` +
                            `Hash: ${block?.hash}\n` +
                            `Parent Hash: ${block?.parentHash}\n` +
                            `Timestamp: ${block?.timestamp}\n` +
                            `Transactions: ${block?.transactions.length}\n` +
                            `Gas Used: ${block?.gasUsed}\n` +
                            `Gas Limit: ${block?.gasLimit}`,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to get block. Error: ${
                        error instanceof Error ? error.message : String(error)
                        }`,
                    },
                ],
            };
        }
    }
);

server.tool(
    "get-transaction",
    "Get transaction details by transaction hash on Monad testnet",
    {
        txHash: z.string().describe("Transaction hash"),
    },
    async ({ txHash }) => {
        try {
            const tx = await publicClient.getTransaction({
                hash: txHash as `0x${string}`,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `Transaction ${tx?.hash}\n` +
                            `From: ${tx?.from}\n` +
                            `To: ${tx?.to}\n` +
                            `Value: ${tx?.value ? formatUnits(tx.value, 18) + ' MON' : '0'}\n` +
                            `Gas Limit: ${tx?.gas}\n` +
                            `Gas Price: ${tx?.gasPrice ? formatUnits(tx.gasPrice, 9) + ' Gwei' : 'N/A'}\n` +
                            `Block Number: ${tx?.blockNumber?.toString()}\n` +
                            `Status: ${tx?.type}`,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to get transaction. Error: ${
                        error instanceof Error ? error.message : String(error)
                        }`,
                    },
                ],
            };
        }
    }
);

server.tool(
    "get-transaction-receipt",
    "Get transaction receipt by transaction hash on Monad testnet",
    {
        txHash: z.string().describe("Transaction hash"),
    },
    async ({ txHash }) => {
        try {
            const receipt = await publicClient.getTransactionReceipt({
                hash: txHash as `0x${string}`,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `Receipt for ${receipt?.transactionHash}\n` +
                            `Status: ${receipt?.status}\n` +
                            `Block Number: ${receipt?.blockNumber}\n` +
                            `Gas Used: ${receipt?.gasUsed}\n` +
                            `Effective Gas Price: ${receipt?.effectiveGasPrice ? formatUnits(receipt.effectiveGasPrice, 9) + ' Gwei' : 'N/A'}\n` +
                            `Logs: ${receipt?.logs.length}`,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to get transaction receipt. Error: ${
                        error instanceof Error ? error.message : String(error)
                        }`,
                    },
                ],
            };
        }
    }
);

server.tool(
    "read-contract",
    "Read data from a smart contract on Monad testnet",
    {
        address: z.string().describe("Contract address"),
        abi: z.string().describe("Contract ABI (JSON array string)"),
        functionName: z.string().describe("Function name to call"),
        args: z.array(z.string()).optional().describe("Function arguments (as strings)"),
    },
    async ({ address, abi, functionName, args }) => {
        try {
            const parsedAbi = parseAbi(JSON.parse(abi));
            const data = await publicClient.readContract({
                address: address as `0x${string}`,
                abi: parsedAbi,
                functionName,
                args: args as any[],
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `Result from ${address}.${functionName}: ${JSON.stringify(data)}`,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to read contract. Error: ${
                        error instanceof Error ? error.message : String(error)
                        }`,
                    },
                ],
            };
        }
    }
);

server.tool(
    "get-code",
    "Get bytecode of a contract address on Monad testnet",
    {
        address: z.string().describe("Contract address"),
    },
    async ({ address }) => {
        try {
            const code = await publicClient.getCode({
                address: address as `0x${string}`,
            });
            const isContract = code && code !== '0x' && code.length > 2;
            return {
                content: [
                    {
                        type: "text",
                        text: isContract && code
                            ? `Contract found at ${address}. Bytecode length: ${code.length} chars`
                            : `No contract found at ${address} (EOA or unverified)`,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to get code. Error: ${
                        error instanceof Error ? error.message : String(error)
                        }`,
                    },
                ],
            };
        }
    }
);

async function main() {
    // Create a transport layer using standard input/output
    const transport = new StdioServerTransport();
    
    // Connect the server to the transport
    await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
