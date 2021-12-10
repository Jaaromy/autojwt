import { devtools, runtime } from "webextension-polyfill";
import { Grid } from 'ag-grid-community';
import jwt_decode from "jwt-decode";
import hljs from 'highlight.js';
import json from 'highlight.js/lib/languages/json';
import moment from 'moment';

hljs.registerLanguage('json', json);

let jwts = {};
const JWT_REGEX = /(^[\w-]+\.[\w-]+\.[\w-]+$)/g;

// Hack for Chrome font size issue
if (navigator.userAgent.indexOf("Chrome") != -1 ) {
    document.getElementsByTagName('body')[0].style.cssText = 'font-size: 110%';
}

function cleanUp(token) {
    return token
        .replace(/^bearer|^token|\s/ig, '');
}

function dateFormatter(data) {
    if (!data.value) {
        return '';
    }

    const d = new Date(0);
    d.setUTCSeconds(data.value);

    return moment(d).format('YYYY-MM-DD h:mm:ss a');
}

let mainGridOptions = {
    columnDefs: [
        { headerName: 'JWT', field: 'jwt', resizable: true },
        { headerName: 'Issuer', field: 'iss', resizable: true, sortable: true },
        { headerName: 'Issued (Local)', field: 'iat', resizable: true, sortable: true, valueFormatter: dateFormatter },
        { headerName: 'Expires (Local)', field: 'exp', resizable: true, sortable: true, valueFormatter: dateFormatter },

    ],
    rowData: [
    ],
    rowSelection: 'single',
    onRowSelected: onRowSelected
};

let responseGridOptions = {
    columnDefs: [
        { headerName: 'JWT', field: 'jwt', hide: true, suppressColumnsToolPanel: true},
        { headerName: 'Url', field: 'url', resizable: true, sortable: true },
        { headerName: 'Method', field: 'method', resizable: true, sortable: true },
        { headerName: 'Status', field: 'status', resizable: true, sortable: true },
        { headerName: 'Status Text', field: 'statusText', resizable: true, sortable: true }

    ],
    rowData: [
    ],
    rowSelection: 'single',
    onSelectionChanged: onResponseRowSelectionChange
};


function onRowSelected(event) {
    if (event.node.isSelected()) {
        let responseContents = document.getElementById('responseContents');
        responseContents.innerHTML = '';
        let jwtContents = document.getElementById('jwtContents');
        let decoded = jwts[event.node.data.jwt].decoded;
        let highlightedCode = hljs.highlight(JSON.stringify(decoded, undefined, 3), { language: 'json' }).value;
        jwtContents.innerHTML = highlightedCode;

        responseGridOptions.api.setRowData([]);

        for (const urlTarget in jwts[event.node.data.jwt].targets) {
            if (Object.hasOwnProperty.call(jwts[event.node.data.jwt].targets, urlTarget)) {
                let response = jwts[event.node.data.jwt].targets[urlTarget];

                responseGridOptions.api.applyTransaction({ add: [{ jwt: event.node.data.jwt, url: urlTarget, method: response.method, status: response.status, statusText: response.statusText }] });
                autoSizeAll(false);
            }
        }
    }
}

function onResponseRowSelectionChange(event) {
    let responseContents = document.getElementById('responseContents');
    responseContents.innerHTML = '';

    let rows = event.api.getSelectedRows();

    if (rows.length > 0) {
        let response = jwts[rows[0].jwt].targets[rows[0].url];
        let highlightedCode = hljs.highlight(JSON.stringify(response, undefined, 3), { language: 'json' }).value;
        responseContents.innerHTML = highlightedCode;
    }
}

function autoSizeAll(skipHeader) {
    const mainColumnIds = [];
    mainGridOptions.columnApi.getAllColumns().forEach((column) => {
        mainColumnIds.push(column.colId);
    });
    mainGridOptions.columnApi.autoSizeColumns(mainColumnIds, skipHeader);
    mainGridOptions.api.sizeColumnsToFit();

    const responseColumnIds = [];
    responseGridOptions.columnApi.getAllColumns().forEach((column) => {
        responseColumnIds.push(column.colId);
    });
    responseGridOptions.columnApi.autoSizeColumns(responseColumnIds, skipHeader);

}

let mainGridDiv = document.querySelector('#mainGrid');
let mainGrid = new Grid(mainGridDiv, mainGridOptions);
mainGridOptions.api.setDomLayout('autoHeight');

let responseGridDiv = document.querySelector('#responseGrid');
let responseGrid = new Grid(responseGridDiv, responseGridOptions);
responseGridOptions.api.setDomLayout('autoHeight');

const jwtButton = document.getElementById('jwtio');
jwtButton.addEventListener('click', () => {
    let rows = mainGridOptions.api.getSelectedRows();

    if (rows.length > 0) {
        runtime.sendMessage({
            tabId: devtools.inspectedWindow.tabId,
            jwt: rows[0].jwt
        });
    }
}, false);

// Thanks to: https://stackoverflow.com/a/30810322
function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}

const copyButton = document.getElementById('copy');
copyButton.addEventListener('click', () => {
    let rows = mainGridOptions.api.getSelectedRows();

    if (rows.length > 0) {
        navigator.clipboard.writeText(rows[0].jwt).then(() => {
        }, () => {
            fallbackCopyTextToClipboard(rows[0].jwt);
        });
    }
}, false);

const copyPayloadButton = document.getElementById('copyPayload');
copyPayloadButton.addEventListener('click', () => {
    let rows = mainGridOptions.api.getSelectedRows();

    if (rows.length > 0) {
        let payload = JSON.stringify(jwts[rows[0].jwt].decoded, undefined, 3);

        navigator.clipboard.writeText(payload).then(() => {
        }, () => {
            fallbackCopyTextToClipboard(payload);
        });
    }
}, false);

const clearButton = document.getElementById('clear');
clearButton.addEventListener('click', () => {
    mainGridOptions.api.setRowData([]);
    let contents = document.getElementById('jwtContents');
    contents.innerHTML = '';
    jwts = {};
    responseGridOptions.api.setRowData([]);
    let responseContents = document.getElementById('responseContents');
    responseContents.innerHTML = '';
}, false);

function toConsole(item) {
    devtools.inspectedWindow.eval(
        'console.log("toConsole: " + unescape("' +
        escape(JSON.stringify(item)) + '"))');
}

function addRow(request, response, token) {
    let tok = cleanUp(token);

    // Double parens around RegExp to get around this issue https://stackoverflow.com/a/68716278
    if (!tok || !((new RegExp(JWT_REGEX).test(tok)))) {
        return;
    }

    if (!jwts[tok]) {
        const decoded = jwt_decode(tok);
        jwts[tok] = { decoded: decoded };
        jwts[tok].targets = {};
        mainGridOptions.api.applyTransaction({ add: [{ jwt: tok, iss: decoded.iss, iat: decoded.iat, exp: decoded.exp }] });
        autoSizeAll(false);
    }

    if (jwts[tok] && !jwts[tok].targets[request.url]) {
        response.method = request.method;
        jwts[tok].targets[request.url] = response;
    }

}

devtools.network.onRequestFinished.addListener(
    function (request) {
        for (const header in request.request.headers) {
            if (Object.hasOwnProperty.call(request.request.headers, header)) {
                const element = request.request.headers[header];

                if (element && element.name && element.name.toLowerCase() === 'authorization') {
                    addRow(request.request, request.response, element.value);
                }
            }
        }
    }
);
