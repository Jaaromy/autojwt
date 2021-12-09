import { devtools,runtime,tabs } from "webextension-polyfill";

function initialisePanel() {

}

function unInitialisePanel() {

}

devtools.panels.create(
    "AutoJWT",
    "images/get_started128.png",
    "panel.html"
).then(function (newPanel) {
    newPanel.onShown.addListener(initialisePanel);
    newPanel.onHidden.addListener(unInitialisePanel);
});
