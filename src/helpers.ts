export function puzzleIdFromUrl(url: string): string {
  const hash = url.indexOf("#");
  return hash === -1 ? url : url.substr(0, hash);
  // const parsedUrl = parse(url);
  // return `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.path}`;
}

export function storageKeyFromPuzzleId(puzzleId: string): string {
  return `puzlog:${puzzleId}`;
}

export function msToTime(duration: number) {
  const milliseconds = duration;
  const seconds = milliseconds / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;

  const strSeconds = `${Math.round(seconds)}`.padStart(2, "0");
  const strMinutes = `${Math.round(minutes)}`.padStart(2, "0");
  const strHours = `${Math.round(hours)}`.padStart(2, "0");

  if (hours < 1) {
    return `${strMinutes}:${strSeconds}`;
  }
  return `${strHours}:${strMinutes}:${strSeconds}`;
}
