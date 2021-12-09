import { devtools, runtime } from "webextension-polyfill";
import { Grid } from 'ag-grid-community';


let gridOptions = {
    columnDefs: [
        { headerName: 'Target', field: 'target', resizable: true },
        { headerName: 'JWT', field: 'jwt', width: 400, minWidth: 400, maxWidth: 1200, resizable: true }
    ],
    rowData: [{ "target": "https://rcrnypmhizh6rke6kmodhyelea.appsync-api.us-east-1.amazonaws.com/graphql", "jwt": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik5Ea3pNVVJFUXpneVJFUTNOelZGT1RBNVFqbEVSREE0TWtVelJqVTBOek15TnprM01VTTBRdyJ9.eyJodHRwczovL2JyaXZvLmNvbS9vbmFpcl91c2VyX2lkIjoxNjQ5NTQ0LCJodHRwczovL2JyaXZvLmNvbS9hY2NvdW50X2lkIjo1ODcyODMsImh0dHBzOi8vYnJpdm8uY29tL3VzZXJuYW1lIjoiSmFhcm9teUludC5za3ZweiIsImh0dHBzOi8vYnJpdm8uY29tL2VtYWlsIjoiamFhcm9teS56aWVyc2VAYnJpdm8uY29tIiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi1pbnRhLmJyaXZvLmNvbS8iLCJzdWIiOiJhdXRoMHw2MTFhOTMzYTE5MjhkOTAwNjgzNGQyNmQiLCJhdWQiOlsiaHR0cHM6Ly9hcGktaW50YS5icml2by5jb20iLCJodHRwczovL2JyaXZvLWludC5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNjM5MDY1OTQ4LCJleHAiOjE2MzkwNzMxNDgsImF6cCI6Im1YVmdCTldMdlJFVm1qRWVXYmJHbzdVcGtCdEhaY3VqIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCBvZmZsaW5lX2FjY2VzcyIsInBlcm1pc3Npb25zIjpbXX0.ri79Ia0tfwcREcYOLkSr9U8z_ZQ39gBOc0zBNQJq22DaVTSPG6D5yNpPxtCmQXKfTislm93bO30v4CkfDWhcxmespWAVyAIwg44FLIm0-NH0Q4nILhpguDKzaJaL4eiW5o1ev0H05QOzyvz0pYhmgQ35-5lKked1Aul3dHKZMN0OHwRy9l_BdFGkZbeA31_EXEPYZZDBou-7b3Un1uhGYzIkYzalVSSW2DmZTp6vi3tslyaAzKMa1e1-ey_sCyV5OJG5z-2DyTloJh2zv_RLKTUpzhBIz46Zu2TDYPuQla6K3rJaq1BJ1-mFrbQew_St-FbOLsCo0nfAT0tpcj_XRw" }
    ],
    rowSelection: 'single',
    onCellClicked: (event) => {
    }
};

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
autoSizeAll(false);

const jwtLink = document.getElementById('jwtio');
jwtLink.addEventListener('click', () => {
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

const copyLink = document.getElementById('copy');
copyLink.addEventListener('click', () => {
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

// devtools.network.onRequestFinished.addListener(
//     function (request) {


//         for (const header in request.request.headers) {
//             if (Object.hasOwnProperty.call(request.request.headers, header)) {
//                 const element = request.request.headers[header];

//                 if (element && element.name && element.name.toLowerCase() === 'authorization') {
//                     // let table = document.getElementById("list").getElementsByTagName('tbody')[0];
//                     // addRow(table, request.request.url, element.value);

//                     gridOptions.api.applyTransaction({ add: [{ target: request.request.url, jwt: element.value }] });
//                     autoSizeAll(false);
//                 }
//             }
//         }
//     }
// );
