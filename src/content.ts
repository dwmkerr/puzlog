import {
  puzzleIdFromUrl,
  storageKeyFromPuzzleId,
} from "./helpers";

enum TimerState {
  Stopped,
  Started,
}

interface PuzzleState {
  puzzleId: string;
  storageKey: string;
  url: string;
  title: string;
  timeLoad: Date;
  timeLastAccess: Date;
  timeStart: Date;
  timeFinish: Date | undefined;
  durationWorking: number;
  timerState: TimerState;
  timerId: number | undefined;
}

//  Start the extension.
console.log("initialising puzlog...");
console.log("listening for messages...");

//  TODO:
//  1. create or load state
//  2. register hanlders
//  3. start/stop/pause timer
//  4. finish xword
//  5. export JSON
//  6. save state to cloud

//  Listen for messages, route to the appropriate handlers.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    const source = sender.tab || "extension";
    const command = request.command || "<unknown>";
    const log = `recieved command '${command}' from ${source}`;
    console.log(log);
    if (command === "getState") {
      const state = await getState();
      sendResponse(state);
    } else if (command === "start") {
      const state = await getState();
      const newState = await startPuzzle(state);
      await saveState(newState);
      sendResponse(newState);
    } else if (command === "stop") {
      const state = await getState();
      const newState = await stopPuzzle(state);
      await saveState(newState);
      sendResponse(newState);
    } else if (command === "reset") {
      const state = await initState();
      await saveState(state);
      sendResponse(state);
    }
  })();

  // Important! Return true to indicate you want to send a response asynchronously
  return true;
});

async function initState(): Promise<PuzzleState> {
  const url = location.href;
  const puzzleId = puzzleIdFromUrl(url);
  const storageKey = storageKeyFromPuzzleId(puzzleId);

  const now = new Date();
  const state = {
    url,
    puzzleId,
    storageKey,
    title: location.href || "",
    timeLoad: now,
    timeLastAccess: now,
    timeStart: now,
    timeFinish: undefined,
    durationWorking: 0,
    timerState: TimerState.Stopped,
    timerId: undefined,
  };
  return state;
}

async function getState(): Promise<PuzzleState> {
  //  Get the current url, puzzle id and storage key.
  const url = location.href;
  const puzzleId = puzzleIdFromUrl(url);
  const storageKey = storageKeyFromPuzzleId(puzzleId);

  //  Grab the puzzle state.
  console.log(`${storageKey}: checking for puzzle state`);
  const storage = await chrome.storage.local.get(storageKey);
  const storageObject = storage[storageKey];
  const storedPuzzleState = storageObject as PuzzleState;

  //  Temporarily we are just going to ingore saved state and start fresh each
  //  time...
  const startClean = true;

  //  If there is no stored state, create the new state and return.
  if (startClean || !storedPuzzleState) {
    const state = await initState();
    return state;
  }

  //  ...otherwise, return our saved state.
  return storedPuzzleState;
}

async function startPuzzle(currentState: PuzzleState): Promise<PuzzleState> {
  //  This could be a clean start or a resume. Start the timer and update the
  //  state.
  const now = new Date();
  const intervalId = window.setInterval(async () => {
    const s1 = await getState();
    const s2 = {
      ...s1,
      durationWorking: new Date() - now,
    };
    await saveState(s2);
  }, 1000);
  return {
    ...currentState,
    timeLastAccess: now,
    timeStart: currentState.timeStart || now, // only update start time if clean
    timerState: TimerState.Started,
    timerId: intervalId,
  };
}

async function stopPuzzle(currentState: PuzzleState): Promise<PuzzleState> {
  //  Create our state with some initial values.
  const now = new Date();
  return {
    ...currentState,
    timeFinish: now,
    timeLastAccess: now,
    timerState: TimerState.Stopped,
  };
}

async function saveState(currentState: PuzzleState): Promise<void> {
  console.log(`${currentState.storageKey}: saving for puzzle state`);
  const items = {
    [currentState.storageKey]: currentState,
  };
  await chrome.storage.local.set(items);
}
