// chrome.runtime.onConnect.addListener((port) => {
//   const tabId = port.sender?.tab?.id;

//   if (tabId) {
//     port.onMessage.addListener((msg) => {
//       if (msg.action === "start") {
//         if (!timers[tabId]) {
//           timers[tabId] = 0;
//           const interval = setInterval(() => {
//             timers[tabId]++;
//             chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//               const activeTabId = tabs[0]?.id;
//               if (activeTabId === tabId) {
//                 chrome.tabs.sendMessage(tabId, {
//                   action: "update",
//                   timer: timers[tabId],
//                 });
//               }
//             });
//           }, 1000);

//           chrome.runtime.onConnect.addListener((port) => {
//             port.onDisconnect.addListener(() => {
//               clearInterval(interval);
//               delete timers[tabId];
//             });
//           });
//         }
//       } else if (msg.action === "pause") {
//         clearInterval(tabId);
//       }
//     });

//     // Send the current timer value to the content script
//     port.postMessage({ action: "update", timer: timers[tabId] || 0 });
//   }
// });
//
import * as ExtensionInterface from "./extensionInterface";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === ExtensionInterface.RuntimeMessages.OpenPuzlogTab) {
    chrome.tabs.create({
      url: chrome.runtime.getURL("puzlog.html"),
    });
  }
});
