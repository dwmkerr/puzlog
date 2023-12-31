export function puzzleIdFromUrl(url: string): string {
  const hash = url.indexOf("#");
  return hash === -1 ? url : url.substr(0, hash);
  // const parsedUrl = parse(url);
  // return `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.path}`;
}

export function storageKeyFromPuzzleId(puzzleId: string): string {
  return `puzlog:${puzzleId}`;
}

export function msToTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const pad = (value: number): string =>
    value < 10 ? `0${value}` : `${value}`;

  return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
}

export function timeAgo(previousTime: Date, currentTime: Date): string {
  const timeDifference = currentTime.getTime() - previousTime.getTime();

  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  } else {
    return `${seconds} second${seconds === 1 ? "" : "s"} ago`;
  }
}
