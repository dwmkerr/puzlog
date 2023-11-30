function init() {
  console.log(`running init...`);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const [currentTab] = tabs;
    const pageName = currentTab.title;
    const pageUrl = currentTab.url;
    console.log(`Page: ${pageName} from ${pageUrl}`);
  });
}

//  Get the button and set the handler.
document.addEventListener("DOMContentLoaded", () => {
  console.log(`content loaded...`);
  const button = document.getElementById("init");
  if (!button) {
    console.log(`warning: cannot find 'init' button`);
  } else {
    console.log(`setting button handler...`);
    button.addEventListener("click", () => init()); // addItems() should be addItems
  }
});
