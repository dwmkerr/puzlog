import { PuzzleState } from "./puzzleState";
import { msToTime } from "./helpers";

async function currentTabId(): Promise<number> {
  const [currentTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const id = currentTab.id;
  if (id === undefined) {
    throw new Error(`unable to identify current tab`);
  }
  return id;
}

function getElementOrFail(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`failed to get required element: ${id}`);
  }
  return element;
}

// Chrome 'sendMessage' uses the 'any' type, disable the warning.
// eslint-disable-next-line
async function sendMessage(message: any): Promise<PuzzleState> {
  //  Send the start message to the current tab.
  const tabId = await currentTabId();
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

async function reset(): Promise<PuzzleState> {
  return await sendMessage({ command: "reset" });
}

interface PopupDOM {
  startButton: HTMLElement;
  pauseButton: HTMLElement;
  finishButton: HTMLElement;
  resetButton: HTMLElement;
  timerDiv: HTMLElement;
  showStateButton: HTMLElement;
  stateCode: HTMLElement;
}

function getPopupDOM(): PopupDOM {
  return {
    startButton: getElementOrFail("start"),
    pauseButton: getElementOrFail("pause"),
    finishButton: getElementOrFail("finish"),
    resetButton: getElementOrFail("reset"),
    timerDiv: getElementOrFail("timer"),
    showStateButton: getElementOrFail("show_state"),
    stateCode: getElementOrFail("state"),
  };
}

//  Get the button and set the handler.
document.addEventListener("DOMContentLoaded", async () => {
  console.log(`puzlog: initialising popup...`);

  const popupDOM = getPopupDOM();
  popupDOM.startButton.addEventListener("click", async () => {
    popupDOM.startButton.style.display = "none";
    popupDOM.pauseButton.style.display = "block";
    await start();
  }); // addItems() should be addItems
  popupDOM.pauseButton.addEventListener("click", async () => {
    popupDOM.startButton.style.display = "block";
    popupDOM.pauseButton.style.display = "none";
    await stop();
  }); // addItems() should be addItems
  popupDOM.showStateButton.addEventListener("click", async () => {
    popupDOM.stateCode.style.display = "block";
  }); // addItem() should be addItems
  popupDOM.resetButton.addEventListener("click", () => reset()); // addItems() should be addItems

  //  When we start, we want to watch for changes.
  const state = await getState();
  chrome.storage.onChanged.addListener((changes) => {
    for (const [key, { newValue }] of Object.entries(changes)) {
      //  If the key is our puzzle key, then we can update the UI.
      if (key === state.storageKey) {
        const duration = newValue.durationWorking;
        const timerDiv = getElementOrFail("timer");
        timerDiv.style.display = "block";
        timerDiv.innerText = msToTime(duration);
        popupDOM.stateCode.innerText = JSON.stringify(newValue, null, 2);
      }
    }
  });
});
