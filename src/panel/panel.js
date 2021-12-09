import { devtools } from "webextension-polyfill";
import { Grid } from 'ag-grid-community';

let gridOptions = {
    columnDefs: [
        { headerName: 'Target', field: 'target' },
        { headerName: 'JWT', field: 'jwt' }
    ],
    rowData: [
    ],
    onCellClicked: (event) => { 
        navigator.permissions.query({ name: 'clipboard-write' }).then(res => {
            devtools.inspectedWindow.eval(
                'console.log("Permissions: " + unescape("' +
                escape(JSON.stringify(res)) + '"))');

        });
        if (event.column.getColId() === 'jwt') {
            navigator.clipboard.writeText(event.value).then(() => {
                devtools.inspectedWindow.eval(
                    'console.log("Clipboard: " + unescape("' +
                    escape('Success') + '"))');
            }, (error) => {
                devtools.inspectedWindow.eval(
                                            'console.log("Clipboard Error: " + unescape("' +
                                            escape(JSON.stringify(error)) + '"))');
            });
        }
    }
};

let eGridDiv = document.querySelector('#myGrid');
let grid = new Grid(eGridDiv, gridOptions);

devtools.network.onRequestFinished.addListener(
    function (request) {


        for (const header in request.request.headers) {
            if (Object.hasOwnProperty.call(request.request.headers, header)) {
                const element = request.request.headers[header];

                if (element && element.name && element.name.toLowerCase() === 'authorization') {
                    // let table = document.getElementById("list").getElementsByTagName('tbody')[0];
                    // addRow(table, request.request.url, element.value);

                    gridOptions.api.applyTransaction({ add: [{ target: request.request.url, jwt: element.value }] });
                }
            }
        }
    }
);
