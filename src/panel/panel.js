import { devtools, runtime } from "webextension-polyfill";
import { Grid } from 'ag-grid-community';
import jwt_decode from "jwt-decode";
import hljs from 'highlight.js';
import json from 'highlight.js/lib/languages/json';

hljs.registerLanguage('json', json);

let gridOptions = {
    columnDefs: [
        { headerName: 'Target', field: 'target', resizable: true },
        { headerName: 'JWT', field: 'jwt', width: 400, minWidth: 400, maxWidth: 1200, resizable: true }
    ],
    rowData: [
    ],
    rowSelection: 'single',
    onRowSelected: onRowSelected,
    onCellClicked: (event) => {
    }
};

function onRowSelected(event) {

    if (event.node.isSelected()) {
        const contents = document.getElementById('jwtContents');
        const decoded = jwt_decode(event.node.data.jwt);
        const highlightedCode = hljs.highlight(JSON.stringify(decoded, undefined, 3), {language: 'json'}).value;

        contents.innerHTML = highlightedCode;
    }

}

function autoSizeAll(skipHeader) {
    const allColumnIds = [];
    gridOptions.columnApi.getAllColumns().forEach((column) => {
        allColumnIds.push(column.colId);
    });

    gridOptions.columnApi.autoSizeColumns(allColumnIds, skipHeader);
}

let eGridDiv = document.querySelector('#myGrid');
let grid = new Grid(eGridDiv, gridOptions);
gridOptions.api.setDomLayout('autoHeight');

// HACK: Remove when ready for real
//autoSizeAll(false);

const jwtButton = document.getElementById('jwtio');
jwtButton.addEventListener('click', () => {
    let rows = gridOptions.api.getSelectedRows();

    if (rows.length > 0) {
        runtime.sendMessage({
            tabId: devtools.inspectedWindow.tabId,
            jwt: rows[0].jwt
        });
    }

    devtools.inspectedWindow.eval(
        'console.log("Rows: " + unescape("' +
        escape(JSON.stringify(rows)) + '"))');
}, false);

const copyButton = document.getElementById('copy');
copyButton.addEventListener('click', () => {
    let rows = gridOptions.api.getSelectedRows();

    if (rows.length > 0) {
        navigator.clipboard.writeText(rows[0].jwt.value).then(() => {
            devtools.inspectedWindow.eval(
                'console.log("Clipboard: " + unescape("' +
                escape('Success') + '"))');
        }, (error) => {
            devtools.inspectedWindow.eval(
                'console.log("Clipboard Error: " + unescape("' +
                escape(JSON.stringify(error)) + '"))');
        });
    }


    devtools.inspectedWindow.eval(
        'console.log("Rows: " + unescape("' +
        escape(JSON.stringify(rows)) + '"))');
}, false);

const clearButton = document.getElementById('clear');
clearButton.addEventListener('click', () => {
    gridOptions.api.setRowData([]);
    const contents = document.getElementById('jwtContents');
    contents.innerHTML = '';

}, false);

devtools.network.onRequestFinished.addListener(
    function (request) {


        for (const header in request.request.headers) {
            if (Object.hasOwnProperty.call(request.request.headers, header)) {
                const element = request.request.headers[header];

                if (element && element.name && element.name.toLowerCase() === 'authorization') {
                    gridOptions.api.applyTransaction({ add: [{ target: request.request.url, jwt: element.value }] });
                    autoSizeAll(false);
                }
            }
        }
    }
);
