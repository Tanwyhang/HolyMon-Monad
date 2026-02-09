**IMPORTANT RULE: DO NOT OVERCOMPLICATE STUFF. Keep solutions simple and direct.**
**ALWAYS ASK for docs, clarification, or confirmation when uncertain.**
**NEVER USE `npm` - ALWAYS USE `bun` for everything.**

## HolyMon Contracts Development Rules

### Smart Contract Development
- Use Solidity ^0.8.20+
- Follow OpenZeppelin standards for ERC20 implementation
- Write comprehensive tests with Hardhat
- Use Hardhat Framework for deployment and testing

### Package Management
- **ALWAYS USE `bun` FOR ALL PACKAGE MANAGEMENT AND SCRIPT EXECUTION**
- **NEVER USE `npm` OR `pnpm`** - only bun is allowed
- Use `bun install` for dependencies
- Use `bun run <script>` or `hardhat <command>` for scripts in package.json

### Testing
- Write tests for all contract functions
- Test edge cases and failure scenarios
- Use Hardhat test with Mocha/Chai
- Write tests in JavaScript or TypeScript in the `test/` directory
- Mock external dependencies when needed

### Deployment
- Always test on local Hardhat network first
- Test on Monad testnet before production
- Verify contract deployment on explorers
- Keep track of deployed addresses in `deployed_addresses.txt`
- Use environment variables for sensitive data

### Code Style
- Use meaningful variable names
- Add NatSpec comments for functions
- Keep functions small and focused
- Use consistent spacing and formatting
