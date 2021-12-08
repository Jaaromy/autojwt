browser.devtools.network.onRequestFinished.addListener(
    function (request) {

        for (const header in request.request.headers) {
            if (Object.hasOwnProperty.call(request.request.headers, header)) {
                const element = request.request.headers[header];

                if (element && element.name && element.name.toLowerCase() === 'authorization') {
                    browser.devtools.inspectedWindow.eval(
                        'console.log("Authorization: " + unescape("' +
                        escape(JSON.stringify(element.value)) + '"))');
                }
            }
        }

        // if (request._resourceType === 'xhr') {
        //     chrome.devtools.inspectedWindow.eval(
        //         'console.log("Large image: " + unescape("' +
        //         escape(JSON.stringify(request.request)) + '"))');
        // }

    }
);

//   chrome.devtools.panels.create("AutoJWT",
//     "images/get_started128.png",
//     "panel.html",
//     function(panel) {
//       // code invoked on panel creation
//     }
// );