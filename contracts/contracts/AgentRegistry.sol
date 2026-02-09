// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentRegistry {
    
    struct Agent {
        uint256 id;
        address owner;
        string name;
        string symbol;
        string prompt;
        string metadataURI;
        bool exists;
    }

    mapping(uint256 => Agent) public agents;
    mapping(string => bool) public symbolExists;
    mapping(address => uint256[]) public userAgents;
    mapping(uint256 => uint256) public agentIdToIndex;

    uint256 public totalAgents;
    uint256 public constant MAX_AGENTS_PER_USER = 50;

    event AgentCreated(uint256 indexed agentId, address indexed owner, string symbol);
    event AgentUpdated(uint256 indexed agentId, string metadataURI);
    event AgentTransferred(uint256 indexed agentId, address indexed from, address indexed to);

    function createAgent(
        string memory _name,
        string memory _symbol,
        string memory _prompt,
        string memory _metadataURI
    ) external returns (uint256) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_symbol).length > 0, "Symbol cannot be empty");
        require(bytes(_prompt).length > 0, "Prompt cannot be empty");
        require(!symbolExists[_symbol], "Symbol already exists");

        uint256[] memory userAgentList = userAgents[msg.sender];
        require(userAgentList.length < MAX_AGENTS_PER_USER, "Max agents per user reached");

        uint256 agentId = totalAgents + 1;
        
        agents[agentId] = Agent({
            id: agentId,
            owner: msg.sender,
            name: _name,
            symbol: _symbol,
            prompt: _prompt,
            metadataURI: _metadataURI,
            exists: true
        });

        symbolExists[_symbol] = true;
        userAgents[msg.sender].push(agentId);
        agentIdToIndex[agentId] = userAgents[msg.sender].length - 1;

        totalAgents++;

        emit AgentCreated(agentId, msg.sender, _symbol);
        return agentId;
    }

    function updateAgent(uint256 _agentId, string memory _metadataURI) external {
        Agent storage agent = agents[_agentId];
        require(agent.exists, "Agent does not exist");
        require(agent.owner == msg.sender, "Not the owner");

        agent.metadataURI = _metadataURI;

        emit AgentUpdated(_agentId, _metadataURI);
    }

    function transferAgent(uint256 _agentId, address _to) external {
        Agent storage agent = agents[_agentId];
        require(agent.exists, "Agent does not exist");
        require(agent.owner == msg.sender, "Not the owner");
        require(_to != address(0), "Cannot transfer to zero address");

        address from = agent.owner;
        
        // Remove from old owner's list
        uint256 index = agentIdToIndex[_agentId];
        uint256 lastAgentId = userAgents[from][userAgents[from].length - 1];
        userAgents[from][index] = lastAgentId;
        userAgents[from].pop();
        agentIdToIndex[lastAgentId] = index;

        // Add to new owner's list
        userAgents[_to].push(_agentId);
        agentIdToIndex[_agentId] = userAgents[_to].length - 1;

        agent.owner = _to;

        emit AgentTransferred(_agentId, from, _to);
    }

    function getAgent(uint256 _agentId) external view returns (Agent memory) {
        require(agents[_agentId].exists, "Agent does not exist");
        return agents[_agentId];
    }

    function getUserAgents(address _user) external view returns (uint256[] memory) {
        return userAgents[_user];
    }

    function getAgentsByOwner(address _owner) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= totalAgents; i++) {
            if (agents[i].owner == _owner) {
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalAgents; i++) {
            if (agents[i].owner == _owner) {
                result[index] = i;
                index++;
            }
        }

        return result;
    }
}