"use client";

import { useAnimationContext } from './AnimationContext';

export function AnimationControls() {
  const { spawnNPC, triggerTalk, triggerSuccess, triggerFail, triggerDeal, triggerPray, actionInProgress } = useAnimationContext();

  const buttons = [
    {
      label: 'Spawn',
      action: spawnNPC,
      color: 'bg-purple-600 hover:bg-purple-700',
      borderColor: 'border-purple-400',
    },
    {
      label: 'Talk',
      action: triggerTalk,
      color: 'bg-blue-600 hover:bg-blue-700',
      borderColor: 'border-blue-400',
    },
    {
      label: 'Success',
      action: triggerSuccess,
      color: 'bg-green-600 hover:bg-green-700',
      borderColor: 'border-green-400',
    },
    {
      label: 'Fail',
      action: triggerFail,
      color: 'bg-red-600 hover:bg-red-700',
      borderColor: 'border-red-400',
    },
    {
      label: 'Deal',
      action: triggerDeal,
      color: 'bg-amber-600 hover:bg-amber-700',
      borderColor: 'border-amber-400',
    },
    {
      label: 'Pray',
      action: triggerPray,
      color: 'bg-cyan-600 hover:bg-cyan-700',
      borderColor: 'border-cyan-400',
    },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 p-4 bg-black/80 border-2 border-purple-500/50 backdrop-blur-sm rounded-lg">
      {buttons.map(({ label, action, color, borderColor }) => (
        <button
          key={label}
          onClick={action}
          disabled={actionInProgress}
          className={`
            px-6 py-3 border-2 ${borderColor} text-white
            font-black uppercase tracking-widest
            hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]
            hover:-translate-y-1 active:translate-y-0
            transition-all disabled:opacity-50 disabled:cursor-not-allowed
            ${color}
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
