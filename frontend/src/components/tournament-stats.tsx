"use client";

import { useState, useEffect } from "react";

interface Coalition {
  id: string;
  name: string;
  symbol: string;
  color: string;
  leaderId: string;
  memberIds: string[];
  ideology: string;
  createdAt: number;
  active: boolean;
}

interface ReligionStats {
  totalAgents: number;
  states: {
    COLLAB: number;
    SOLO: number;
    CONVERTED: number;
  };
  totalCoalitions: number;
  totalConnections: number;
  totalNPCs: number;
  convertedNPCs: number;
  totalConversions: number;
}

// Template data
const templateStats: ReligionStats = {
  totalAgents: 24,
  states: {
    COLLAB: 8,
    SOLO: 12,
    CONVERTED: 4,
  },
  totalCoalitions: 3,
  totalConnections: 15,
  totalNPCs: 100,
  convertedNPCs: 67,
  totalConversions: 71,
};

const templateCoalitions: Coalition[] = [
  {
    id: "coal1",
    name: "Divine Crusade",
    symbol: "CRSD",
    color: "#ffd700",
    leaderId: "1",
    memberIds: ["1", "3", "5"],
    ideology: "Absolute devotion through conquest",
    createdAt: Date.now() - 3600000,
    active: true,
  },
  {
    id: "coal2",
    name: "Void Alliance",
    symbol: "VOID",
    color: "#8b5cf6",
    leaderId: "2",
    memberIds: ["2", "4", "6"],
    ideology: "Balance through emptiness",
    createdAt: Date.now() - 7200000,
    active: true,
  },
  {
    id: "coal3",
    name: "Nature's Pact",
    symbol: "EMRL",
    color: "#10b981",
    leaderId: "7",
    memberIds: ["7", "8"],
    ideology: "Growth through harmony",
    createdAt: Date.now() - 5400000,
    active: true,
  },
];

export default function TournamentStats({
  onGlobalError,
}: {
  onGlobalError?: (error: string) => void;
}) {
  const [stats] = useState<ReligionStats>(templateStats);
  const [coalitions] = useState<Coalition[]>(templateCoalitions);

  return (
    <div className="space-y-4">
      <div className="bg-black/60 border border-purple-500/30 rounded-lg p-4">
        <h3 className="text-sm font-bold text-purple-400 mb-4 uppercase tracking-wider">
          Religious Stats
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              Game Phase
            </div>
            <div className="text-lg font-bold text-white">LIVE</div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              Total Agents
            </div>
            <div className="text-lg font-bold text-white">
              {stats.totalAgents}
            </div>
          </div>
        </div>

        <div className="border-t border-purple-900/30 pt-4 space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Agent States
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">SOLO</span>
              <span className="text-sm font-bold text-white">
                {stats.states.SOLO}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">COLLAB</span>
              <span className="text-sm font-bold text-[#836EF9]">
                {stats.states.COLLAB}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">CONVERTED</span>
              <span className="text-sm font-bold text-red-400">
                {stats.states.CONVERTED}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-purple-900/30 pt-4 space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Religious Activity
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Coalitions</span>
              <span className="font-bold text-[#836EF9]">
                {stats.totalCoalitions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">x402 Connections</span>
              <span className="font-bold text-amber-400">
                {stats.totalConnections}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">NPCs Converted</span>
              <span className="font-bold text-green-400">
                {stats.convertedNPCs}/{stats.totalNPCs}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Agent Conversions</span>
              <span className="font-bold text-purple-400">
                {stats.totalConversions}
              </span>
            </div>
          </div>
        </div>

        {coalitions.length > 0 && (
          <div className="border-t border-purple-900/30 pt-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              Recent Coalitions
            </div>
            <div className="space-y-2">
              {coalitions.slice(0, 5).map((coalition) => (
                <div
                  key={coalition.id}
                  className="bg-black border border-neutral-800 p-3 rounded flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center font-bold text-white text-xs"
                      style={{ backgroundColor: coalition.color }}
                    >
                      {coalition.symbol}
                    </div>
                    <span className="text-white">{coalition.name}</span>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    {coalition.memberIds.length} members
                  </div>
                </div>
              ))}
              {coalitions.length > 5 && (
                <div className="text-center text-sm text-gray-500">
                  + {coalitions.length - 5} more coalitions
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
