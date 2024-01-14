import { ExtensionMessageNameMap } from "./lib/extensionMessages";

export function navigateToPuzlogInterface() {
  //  Navigate to the puzlog index.
  chrome.tabs.create({
    url: chrome.runtime.getURL("puzlog.html"),
  });
}

export async function getCurrentTabId(): Promise<number> {
  const [currentTab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const id = currentTab.id;
  if (id === undefined) {
    throw new Error(`unable to identify current tab`);
  }
  return id;
}

export async function sendRuntimeMessage<
  K extends keyof ExtensionMessageNameMap
>(messageName: K, message: ExtensionMessageNameMap[K]) {
  const response = await chrome.runtime.sendMessage({
    ...message,
    command: messageName,
  });
  return response;
}

export async function sendTabMessage<K extends keyof ExtensionMessageNameMap>(
  messageName: K,
  tabId: number,
  message: ExtensionMessageNameMap[K]
) {
  const response = await chrome.tabs.sendMessage(tabId, {
    ...message,
    command: messageName,
  });
  return response;
}

export function onMessage<K extends keyof ExtensionMessageNameMap>(
  messageName: K,
  handler: (
    tabId: number | null,
    message: ExtensionMessageNameMap[K]
  ) => Promise<object | void>
): void {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const tabId = sender.tab?.id || null;
    const source = tabId ? `Tab ${tabId}` : "Extension";
    const command = request.command || "<unknown>";
    if (command === messageName) {
      const log = `recieved command '${command}' from ${source}`;
      console.log(log);
      handler(tabId, request as ExtensionMessageNameMap[K])
        .then((response) => {
          sendResponse(response);
        })
        .catch((err) => {
          console.error("Failed to send response", tabId, source, command);
          throw err;
        });
      // Important! Return true to indicate you want to send a response asynchronously
      return true;
    }
    return false; // nothing to send...
  });
}
