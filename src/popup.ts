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

async function sendMessage(message: any): Promise<void> {
  //  Send the start message to the current tab.
  const tabId = await currentTabId();
  const newState = await chrome.tabs.sendMessage(tabId, message);
  const stateCode = getElementOrFail("state");
  stateCode.innerText = JSON.stringify(newState, null, 2);
  return newState;
}

async function getState(): Promise<void> {
  return await sendMessage({ command: "getState" });
}

async function start(): Promise<void> {
  const newState = await sendMessage({ command: "start" });

  return newState;
}

async function stop(): Promise<void> {
  return await sendMessage({ command: "stop" });
}

async function reset(): Promise<void> {
  return await sendMessage({ command: "reset" });
}

//  Get the button and set the handler.
document.addEventListener("DOMContentLoaded", async () => {

  console.log(`puzlog: initialising popup...`);
  //  When we start, we want to watch for changes.
  const state = await getState();
  chrome.storage.onChanged.addListener((changes) => {
    for (const [key, { newValue }] of Object.entries(changes)) {
      //  If the key is our puzzle key, then we can update the UI.
      if (key === state.storageKey) {
        const duration = newValue.durationWorking;
        console.log(`timer: ${duration}`);
        const timerDiv = getElementOrFail("timer");
        timerDiv.style.display = "block";
        timerDiv.innerText = msToTime(duration);
      }
    }
  });

  const stateCode = getElementOrFail("state");

  stateCode.innerText = JSON.stringify(state, null, 2);
  getElementOrFail("start").addEventListener("click", () => start()); // addItems() should be addItems
  getElementOrFail("stop").addEventListener("click", () => stop()); // addItems() should be addItems
  getElementOrFail("reset").addEventListener("click", () => reset()); // addItems() should be addItems
});
