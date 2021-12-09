import { tabs, runtime } from "webextension-polyfill";

function onCreated(tab) {
    console.log(`Created new tab: ${tab.id}`);
}

function onError(error) {
    console.log(`Error: ${error}`);
}

function handleMessage(request, sender, sendResponse) {

    if (sender.url != browser.runtime.getURL("panel.html")) {
      return;
    }

    tabs.create({
        url: `https://jwt.io/#debugger-io?token=${request.jwt}`
    }).then(onCreated, onError);

}

runtime.onMessage.addListener(handleMessage); 