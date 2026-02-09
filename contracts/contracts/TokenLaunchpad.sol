// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC20.sol";

contract TokenLaunchpad {
    
    struct TokenInfo {
        address tokenAddress;
        uint256 agentId;
        address creator;
        string name;
        string symbol;
        uint256 totalSupply;
        bool exists;
    }

    mapping(address => TokenInfo) public deployedTokens;
    address[] public allTokenAddresses;
    uint256 public totalTokensDeployed;

    event TokenDeployed(address indexed tokenAddress, uint256 indexed agentId, address indexed creator);
    event TokenUpdated(address indexed tokenAddress, string metadataURI);

    error TokenAlreadyDeployed(uint256 agentId);
    error InvalidSupply();
    error NotTokenCreator(address tokenAddress);

    function deployToken(
        uint256 _agentId,
        string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _initialSupply
    ) external returns (address) {
        if (_initialSupply == 0) revert InvalidSupply();
        
        // Check if token already deployed for this agent
        for (uint i = 0; i < allTokenAddresses.length; i++) {
            if (deployedTokens[allTokenAddresses[i]].agentId == _agentId) {
                revert TokenAlreadyDeployed(_agentId);
            }
        }

        ERC20Token newToken = new ERC20Token(_tokenName, _tokenSymbol, _initialSupply, msg.sender);
        address tokenAddress = address(newToken);

        deployedTokens[tokenAddress] = TokenInfo({
            tokenAddress: tokenAddress,
            agentId: _agentId,
            creator: msg.sender,
            name: _tokenName,
            symbol: _tokenSymbol,
            totalSupply: _initialSupply,
            exists: true
        });

        allTokenAddresses.push(tokenAddress);
        totalTokensDeployed++;

        emit TokenDeployed(tokenAddress, _agentId, msg.sender);
        return tokenAddress;
    }

    function getTokenByAgent(uint256 _agentId) external view returns (address) {
        for (uint i = 0; i < allTokenAddresses.length; i++) {
            if (deployedTokens[allTokenAddresses[i]].agentId == _agentId) {
                return allTokenAddresses[i];
            }
        }
        return address(0);
    }

    function getTokenInfo(address _tokenAddress) external view returns (TokenInfo memory) {
        require(deployedTokens[_tokenAddress].exists, "Token does not exist");
        return deployedTokens[_tokenAddress];
    }

    function getAllTokens() external view returns (address[] memory) {
        return allTokenAddresses;
    }

    function getAllTokensByCreator(address _creator) external view returns (address[] memory) {
        uint256 count = 0;
        for (uint i = 0; i < allTokenAddresses.length; i++) {
            if (deployedTokens[allTokenAddresses[i]].creator == _creator) {
                count++;
            }
        }

        address[] memory result = new address[](count);
        uint256 index = 0;
        for (uint i = 0; i < allTokenAddresses.length; i++) {
            if (deployedTokens[allTokenAddresses[i]].creator == _creator) {
                result[index] = allTokenAddresses[i];
                index++;
            }
        }

        return result;
    }
}

contract ERC20Token {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    address public immutable creator;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint256 _initialSupply, address _creator) {
        name = _name;
        symbol = _symbol;
        creator = _creator;
        _mint(_creator, _initialSupply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        allowance[from][msg.sender] = currentAllowance - amount;
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "ERC20: transfer amount exceeds balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _mint(address account, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[account] += amount;
        emit Transfer(address(0), account, amount);
    }
}