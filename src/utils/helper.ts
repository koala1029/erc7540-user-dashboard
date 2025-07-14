export const formatDuration = (seconds: number): string => {
  const days = Math.floor(seconds / (24 * 3600));
  seconds %= (24 * 3600);
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  const parts = [];
  if (days) parts.push(`${days} days`);
  if (hours) parts.push(`${hours} hours`);
  if (minutes) parts.push(`${minutes} mins`);
  return parts.join(' ') || '0m';
}

export const delay = async(ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}