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
  //  Treat negative numbers as zero.
  const ms = milliseconds > 0 ? milliseconds : 0;

  //  Break up into hh:mm:ss.
  const seconds = Math.floor(ms / 1000);
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

export function isExtensionAccessibleTab(
  url: string | null | undefined
): boolean {
  //  Undefined tabs are found when we open a new chrome tab - it has no
  //  address and shows user-customisable content.
  if (url === undefined || url === null || url === "") {
    return false;
  }

  //  Chrome tabs (such as options, extensions, whatever) are not accessible
  //  by extensions.
  if (url.startsWith("chrome://")) {
    return false;
  }

  //  Chrome extensions themselves we also do not access (e.g the Puzlog home
  //  page).
  if (url.startsWith("chrome-extension://")) {
    return false;
  }

  //  The page (should) be accessible to our content script...
  return true;
}
