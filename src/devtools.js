import { devtools } from "webextension-polyfill";

// devtools.network.onRequestFinished.addListener(
//     function (request) {

//         for (const header in request.request.headers) {
//             if (Object.hasOwnProperty.call(request.request.headers, header)) {
//                 const element = request.request.headers[header];

//                 if (element && element.name && element.name.toLowerCase() === 'authorization') {
//                     devtools.inspectedWindow.eval(
//                         'console.log("Authorization: " + unescape("' +
//                         escape(JSON.stringify(element.value)) + '"))');
//                 }
//             }
//         }
//     }
// );

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