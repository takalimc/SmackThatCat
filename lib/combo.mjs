export const COMBO_GAP_MS = 600;

export function nextStreak(streak, gap) {
  return gap <= COMBO_GAP_MS ? streak + 1 : 1;
}

export function comboMultiplier(streak) {
  if (streak >= 6) return 3;
  return streak >= 3 ? 2 : 1;
}
