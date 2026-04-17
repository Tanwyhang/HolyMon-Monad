"use client";

import { useState, useEffect } from 'react';
import { useAnimationContext } from './AnimationContext';
import type { CharacterPositionId } from './AnimationContext';

const CHARACTER_LABELS: Record<CharacterPositionId, string> = {
  castle: 'Castle',
  jesus: 'Jesus',
  moanad: 'Moanad GOD',
  boss: 'NSFW Boss',
  leng1: 'Leng 1',
  leng2: 'Leng 2',
  leng3: 'Leng 3',
};

export function PositionControlPanel() {
  const {
    characterPositions,
    setCharacterPosition,
    npcs,
    setNPCPosition,
  } = useAnimationContext();

  type SelectableId = CharacterPositionId | `npc-${string}`;

  const fixedOptions: { id: CharacterPositionId; label: string }[] = (
    Object.keys(CHARACTER_LABELS) as CharacterPositionId[]
  ).map((id) => ({ id, label: CHARACTER_LABELS[id] }));

  const npcOptions = npcs.map((npc) => ({
    id: `npc-${npc.id}` as SelectableId,
    label: `NPC ${npc.id.slice(-6)}`,
  }));

  const allOptions = [...fixedOptions, ...npcOptions];

  const [selectedId, setSelectedId] = useState<SelectableId | ''>('jesus');

  // Reset to Jesus if selected NPC was removed (e.g. after Reset)
  useEffect(() => {
    if (selectedId.startsWith('npc-')) {
      const id = selectedId.replace(/^npc-/, '');
      if (!npcs.some((n) => n.id === id)) setSelectedId('jesus');
    }
  }, [npcs, selectedId]);

  const isNPC = typeof selectedId === 'string' && selectedId.startsWith('npc-');
  const npcId = isNPC ? (selectedId as string).replace(/^npc-/, '') : null;
  const positionId = !isNPC && selectedId ? (selectedId as CharacterPositionId) : null;

  const currentPosition: [number, number, number] = npcId
    ? (npcs.find((n) => n.id === npcId)?.position ?? [0, 0, 0])
    : positionId && characterPositions[positionId]
      ? characterPositions[positionId]
      : [0, 0, 0];

  const setPosition = (pos: [number, number, number]) => {
    if (npcId) setNPCPosition(npcId, pos);
    else if (positionId) setCharacterPosition(positionId, pos);
  };

  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-4 right-0 z-50 flex flex-row-reverse">
      {/* Toggle tab - always visible on the right edge */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center min-w-10 h-14 px-2 rounded-l-lg bg-black/80 border-2 border-r-0 border-purple-500/50 text-purple-300 hover:bg-purple-900/40 hover:text-white transition-colors"
        title={open ? 'Close panel' : 'Open position panel'}
        aria-expanded={open}
      >
        <span
          className="text-xs font-bold uppercase tracking-wider whitespace-nowrap"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          Position
        </span>
      </button>
      {/* Sliding panel - slides in from the right when open */}
      <div
        className={`
          w-72 overflow-hidden border-2 border-r-0 border-purple-500/50 rounded-l-lg bg-black/80 backdrop-blur-sm
          transition-[transform,opacity] duration-300 ease-out
          ${open ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}
        `}
      >
        <div className="p-4 text-white">
          <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300 mb-3">
            Position (XYZ)
          </h3>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value as SelectableId | '')}
            className="w-full mb-3 px-3 py-2 bg-white/10 border border-purple-400/50 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {fixedOptions.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
            {npcOptions.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <div className="flex flex-col gap-4">
            {(['x', 'y', 'z'] as const).map((axis, i) => {
              const min = axis === 'y' ? -5 : -30;
              const max = axis === 'y' ? 15 : 100;
              const value = currentPosition[i];
              return (
                <label key={axis} className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs uppercase text-purple-300">{axis}</span>
                    <span className="text-sm tabular-nums text-white/90">{value.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={0.5}
                    value={value}
                    onChange={(e) => {
                      const next = [...currentPosition] as [number, number, number];
                      next[i] = parseFloat(e.target.value);
                      setPosition(next);
                    }}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-grab"
                  />
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
