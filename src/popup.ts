import { PuzzleState } from "./lib/puzzleState";
import { msToTime, timeAgo } from "./helpers";
import { getElementOrFail } from "./document";
import * as extensionInterface from "./extensionInterface";

// Chrome 'sendMessage' uses the 'any' type, disable the warning.
// eslint-disable-next-line
async function sendMessage(message: any): Promise<PuzzleState> {
  //  Send the start message to the current tab.
  const tabId = await extensionInterface.getCurrentTabId();
  const newState = await chrome.tabs.sendMessage(tabId, message);
  return newState;
}

async function getState(): Promise<PuzzleState> {
  return await sendMessage({ command: "getState" });
}

async function start(): Promise<PuzzleState> {
  const newState = await sendMessage({ command: "start" });

  return newState;
}

async function stop(): Promise<PuzzleState> {
  return await sendMessage({ command: "stop" });
}

async function finish(): Promise<PuzzleState> {
  return await sendMessage({ command: "finish" });
}

async function reset(): Promise<PuzzleState> {
  return await sendMessage({ command: "reset" });
}

interface PopupDOM {
  puzlogTitle: HTMLLinkElement;
  startButton: HTMLButtonElement;
  pauseButton: HTMLButtonElement;
  finishButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  timerDiv: HTMLElement;
  showStateButton: HTMLButtonElement;
  stateCode: HTMLElement;
  timeSinceStart: HTMLElement;
}

function getPopupDOM(): PopupDOM {
  return {
    puzlogTitle: getElementOrFail("puzlog_title") as HTMLLinkElement,
    startButton: getElementOrFail("start") as HTMLButtonElement,
    pauseButton: getElementOrFail("pause") as HTMLButtonElement,
    finishButton: getElementOrFail("finish") as HTMLButtonElement,
    resetButton: getElementOrFail("reset") as HTMLButtonElement,
    timerDiv: getElementOrFail("timer"),
    showStateButton: getElementOrFail("show_state") as HTMLButtonElement,
    stateCode: getElementOrFail("state"),
    timeSinceStart: getElementOrFail("timeSinceStart"),
  };
}

//  Get the button and set the handler.
document.addEventListener("DOMContentLoaded", async () => {
  console.log(`puzlog: initialising popup...`);

  const popupDOM = getPopupDOM();
  popupDOM.startButton.addEventListener("click", async () => {
    popupDOM.startButton.disabled = true;
    popupDOM.pauseButton.disabled = false;
    await start();
  }); // addItems() should be addItems
  popupDOM.pauseButton.addEventListener("click", async () => {
    popupDOM.startButton.disabled = false;
    popupDOM.pauseButton.disabled = true;
    await stop();
  }); // addItems() should be addItems
  popupDOM.finishButton.addEventListener("click", async () => {
    popupDOM.startButton.disabled = false;
    popupDOM.pauseButton.disabled = true;
    await finish();

    //  Navigate to the puzlog index.
    extensionInterface.navigateToPuzlogInterface();
  }); // addItems() should be addItems
  popupDOM.showStateButton.addEventListener("click", async () => {
    popupDOM.stateCode.style.display = "block";
  }); // addItem() should be addItems
  popupDOM.resetButton.addEventListener("click", () => reset()); // addItems() should be addItems
  popupDOM.puzlogTitle.addEventListener("click", () =>
    extensionInterface.navigateToPuzlogInterface()
  );

  //  This function updates our UI with state.
  const updateUI = (state: PuzzleState) => {
    const duration = state.elapsedTime;
    const timerDiv = getElementOrFail("timer");
    timerDiv.style.display = "block";
    timerDiv.innerText = msToTime(duration);
    popupDOM.stateCode.innerText = JSON.stringify(state, null, 2);

    //  If we have a time start, update the 'time since start' div.
    if (state.timeStart) {
      const timeStart = new Date(state.timeStart);
      const timeAgoText = timeAgo(timeStart, new Date());
      popupDOM.timeSinceStart.innerText = `Started ${timeAgoText}`;
    }
  };

  //  Get current state and watch state for changes.
  const state = await getState();
  updateUI(state);
  chrome.runtime.onMessage.addListener((request) => {
    if (request.command === "stateUpdated") {
      const puzzleState = request.puzzleState as PuzzleState;
      if (puzzleState) {
        updateUI(puzzleState);
      }
    }
  });
});
