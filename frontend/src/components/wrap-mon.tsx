"use client";

import { useState } from "react";
import { useWrapMon } from "@/hooks/use-wrap-mon";

export function WrapMon() {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"wrap" | "unwrap">("wrap");
  const {
    monBalance,
    wmonBalance,
    wrap,
    unwrap,
    isDepositing,
    isWithdrawing,
    isDepositConfirming,
    isWithdrawConfirming,
  } = useWrapMon();

  const isProcessing =
    isDepositing ||
    isWithdrawing ||
    isDepositConfirming ||
    isWithdrawConfirming;

  const handleMax = () => {
    if (mode === "wrap") {
      setAmount((Number(monBalance) / 1e18).toFixed(6));
    } else {
      setAmount((Number(wmonBalance) / 1e18).toFixed(6));
    }
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return;

    if (mode === "wrap") {
      if (Number(amount) * 1e18 > Number(monBalance)) {
        alert("Insufficient MON balance");
        return;
      }
      await wrap(amount);
    } else {
      if (Number(amount) * 1e18 > Number(wmonBalance)) {
        alert("Insufficient WMON balance");
        return;
      }
      await unwrap(amount);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold uppercase tracking-wide">
          Wrap/Unwrap MON
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("wrap")}
            className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${
              mode === "wrap"
                ? "bg-[#836EF9] text-white"
                : "bg-neutral-900 text-neutral-500 hover:text-white"
            }`}
          >
            Wrap
          </button>
          <button
            onClick={() => setMode("unwrap")}
            className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${
              mode === "unwrap"
                ? "bg-[#836EF9] text-white"
                : "bg-neutral-900 text-neutral-500 hover:text-white"
            }`}
          >
            Unwrap
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-black border border-neutral-800 p-4">
          <label className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block">
            {mode === "wrap" ? "MON to Wrap" : "WMON to Unwrap"}
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl font-mono font-bold text-white focus:outline-none"
              disabled={isProcessing}
            />
            <button
              onClick={handleMax}
              className="px-3 py-1 text-xs font-bold bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
              disabled={isProcessing}
            >
              MAX
            </button>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span>{mode === "wrap" ? "MON" : "WMON"}</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            Balance:{" "}
            {mode === "wrap"
              ? `${(Number(monBalance) / 1e18).toFixed(6)} MON`
              : `${(Number(wmonBalance) / 1e18).toFixed(6)} WMON`}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!amount || Number(amount) <= 0 || isProcessing}
          className={`w-full py-4 font-black uppercase tracking-wider transition-all ${
            isProcessing || !amount || Number(amount) <= 0
              ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
              : "bg-white text-black hover:bg-amber-500 shadow-[4px_4px_0px_0px_rgba(131,110,249,0.8)]"
          }`}
        >
          {isProcessing
            ? "Processing..."
            : mode === "wrap"
              ? "Wrap MON"
              : "Unwrap WMON"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
        <div>
          <div className="text-xs text-neutral-500 uppercase mb-1">
            MON Balance
          </div>
          <div className="text-lg font-mono font-bold text-white">
            {(Number(monBalance) / 1e18).toFixed(4)}
          </div>
        </div>
        <div>
          <div className="text-xs text-neutral-500 uppercase mb-1">
            WMON Balance
          </div>
          <div className="text-lg font-mono font-bold text-white">
            {(Number(wmonBalance) / 1e18).toFixed(4)}
          </div>
        </div>
      </div>
    </div>
  );
}
