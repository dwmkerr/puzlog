export function puzzleIdFromUrl(url: string): string {
  const hash = url.indexOf("#");
  return hash === -1 ? url : url.substr(0, hash);
  // const parsedUrl = parse(url);
  // return `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.path}`;
}

export function storageKeyFromPuzzleId(puzzleId: string): string {
  return `puzlog:${puzzleId}`;
}

export function msToTime(duration) {
  let milliseconds = parseInt((duration%1000))
    , seconds = parseInt((duration/1000)%60)
    , minutes = parseInt((duration/(1000*60))%60)
    , hours = parseInt((duration/(1000*60*60))%24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}
