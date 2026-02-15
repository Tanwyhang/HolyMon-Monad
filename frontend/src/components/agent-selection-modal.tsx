"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { getHolyMonAgents } from "@/lib/api-client";
import type { HolyMonAgent } from "@/types/agent";
import { X, Check } from "lucide-react";

interface AgentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (selectedAgents: HolyMonAgent[]) => Promise<void>;
}

export default function AgentSelectionModal({
  isOpen,
  onClose,
  onDeploy,
}: AgentSelectionModalProps) {
  const { address, isConnected } = useAccount();
  const [agents, setAgents] = useState<HolyMonAgent[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isElizaConfigured = (agent: HolyMonAgent): boolean => {
    return (
      !!agent.elizaos &&
      !!agent.elizaos.topics &&
      agent.elizaos.topics.length > 0
    );
  };

  const canJoinArena = (agent: HolyMonAgent): boolean => {
    return isElizaConfigured(agent);
  };

  const filteredAgents = agents.filter((agent) => canJoinArena(agent));

  useEffect(() => {
    if (isOpen && isConnected && address) {
      loadAgents();
    }
  }, [isOpen, isConnected, address]);

  const loadAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const userAgents = await getHolyMonAgents();
      setAgents(userAgents);
    } catch (err) {
      setError("Failed to load your agents. Please try again.");
      console.error("Error loading agents:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgentSelection = (agentId: string) => {
    const newSelection = new Set(selectedAgentIds);
    if (newSelection.has(agentId)) {
      newSelection.delete(agentId);
    } else {
      newSelection.add(agentId);
    }
    setSelectedAgentIds(newSelection);
  };

  const handleDeploy = async () => {
    if (selectedAgentIds.size === 0) {
      setError("Please select at least one agent to deploy.");
      return;
    }

    const selectedAgents = agents.filter((a) => selectedAgentIds.has(a.id));
    setDeploying(true);
    setError(null);

    try {
      await onDeploy(selectedAgents);
      setSelectedAgentIds(new Set());
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to deploy agents. Please try again.",
      );
    } finally {
      setDeploying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-purple-500/30 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Deploy Agents to Arena
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Select your agents with ElizaOS configuration to participate
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            disabled={deploying}
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">🔌</div>
              <h3 className="text-xl font-bold text-white mb-2">
                Wallet Not Connected
              </h3>
              <p className="text-gray-400">
                Please connect your wallet to view your agents.
              </p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400">Loading your agents...</p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-white mb-2">
                No Eligible Agents
              </h3>
              <p className="text-gray-400 mb-4">
                {agents.length === 0
                  ? "You don't have any agents yet. Create one first!"
                  : "Your agents need ElizaOS configuration to join the arena."}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-400">
                  <span className="font-bold text-white">
                    {selectedAgentIds.size}
                  </span>{" "}
                  / {filteredAgents.length} agents selected
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgentSelection(agent.id)}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                      ${
                        selectedAgentIds.has(agent.id)
                          ? "border-purple-500 bg-purple-900/20"
                          : "border-neutral-700 bg-neutral-900/50 hover:border-neutral-600"
                      }
                    `}
                  >
                    {selectedAgentIds.has(agent.id) && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white">
                        {agent.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{agent.name}</h4>
                        <span className="text-xs text-purple-400">
                          {agent.symbol}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                      {agent.description}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {agent.elizaos?.topics?.slice(0, 3).map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              {agents.length > filteredAgents.length && (
                <div className="mt-6 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                  <p className="text-sm text-amber-300">
                    ⚠️ {agents.length - filteredAgents.length} agent(s) cannot
                    join the arena because they lack ElizaOS configuration.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 border-t border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="p-6 border-t border-neutral-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={deploying}
            className="px-6 py-2 border border-neutral-700 hover:bg-neutral-800 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDeploy}
            disabled={deploying || selectedAgentIds.size === 0}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {deploying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deploying...
              </>
            ) : (
              `Deploy ${selectedAgentIds.size} Agent${selectedAgentIds.size !== 1 ? "s" : ""}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
