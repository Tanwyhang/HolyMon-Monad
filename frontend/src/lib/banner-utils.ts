// Function to get a brutalist pixel art banner for tournaments
export const getTournamentBanner = (seed: string) => {
  // Using DiceBear with 'shapes' style but customized to look like brutalist art
  // We use the seed to generate consistent banners for the same tournament
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=1a1a1a,2a2a2a,000000&shape1Color=836EF9,ff00ff,22d3ee&shape2Color=ffffff,cccccc&shape3Color=4a4a4a`;
};
