import { devtools, runtime } from "webextension-polyfill";
import { Grid } from 'ag-grid-community';
import jwt_decode from "jwt-decode";
import hljs from 'highlight.js';
import json from 'highlight.js/lib/languages/json';
import moment from 'moment';

hljs.registerLanguage('json', json);

let jwts = {};
const JWT_REGEX = /(^[\w-]+\.[\w-]+\.[\w-]+$)/g;

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

let gridOptions = {
    columnDefs: [
        { headerName: 'JWT', field: 'jwt', maxWidth: 250, resizable: true },
        { headerName: 'Issuer', field: 'iss', resizable: true, sortable: true },
        { headerName: 'Issued (Local)', field: 'iat', resizable: true, sortable: true, valueFormatter: dateFormatter },
        { headerName: 'Expires (Local)', field: 'exp', resizable: true, sortable: true, valueFormatter: dateFormatter },

    ],
    rowData: [
    ],
    rowSelection: 'single',
    onRowSelected: onRowSelected
};

function onRowSelected(event) {
    if (event.node.isSelected()) {
        let jwtContents = document.getElementById('jwtContents');
        let urlList = document.getElementById('urlList');
        urlList.replaceChildren();
        let decoded = jwts[event.node.data.jwt].decoded;
        let highlightedCode = hljs.highlight(JSON.stringify(decoded, undefined, 3), { language: 'json' }).value;
        jwtContents.innerHTML = highlightedCode;

        for (const urlTarget in jwts[event.node.data.jwt].targets) {
            if (Object.hasOwnProperty.call(jwts[event.node.data.jwt].targets, urlTarget)) {
                //const target = jwts[event.node.data.jwt].targets[urlTarget];
                
                let li = document.createElement("li");
                li.appendChild(document.createTextNode(urlTarget));
                urlList.appendChild(li);
            }
        }
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
}, false);

const copyButton = document.getElementById('copy');
copyButton.addEventListener('click', () => {
    let rows = gridOptions.api.getSelectedRows();

    if (rows.length > 0) {
        navigator.clipboard.writeText(rows[0].jwt).then(() => {
            toConsole('Success');
        }, (error) => {
            toConsole('Failed Copy');
        });
    }
}, false);

const clearButton = document.getElementById('clear');
clearButton.addEventListener('click', () => {
    gridOptions.api.setRowData([]);
    const contents = document.getElementById('jwtContents');
    contents.innerHTML = '';
    jwts = {};

    let urlList = document.getElementById('urlList');
    urlList.replaceChildren();

}, false);

const addRowButton = document.getElementById('add');
addRowButton.addEventListener('click', () => {
    addRow("https://supercoolsiteyeah.awesome.com?email=jaaromy.zierse@gmail.com", "Token eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik5Ea3pNVVJFUXpneVJFUTNOelZGT1RBNVFqbEVSREE0TWtVelJqVTBOek15TnprM01VTTBRdyJ9.eyJodHRwczovL2JyaXZvLmNvbS9vbmFpcl91c2VyX2lkIjoxNjQ5NTQ0LCJodHRwczovL2JyaXZvLmNvbS9hY2NvdW50X2lkIjo1ODcyODMsImh0dHBzOi8vYnJpdm8uY29tL3VzZXJuYW1lIjoiSmFhcm9teUludC5za3ZweiIsImh0dHBzOi8vYnJpdm8uY29tL2VtYWlsIjoiamFhcm9teS56aWVyc2VAYnJpdm8uY29tIiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi1pbnRhLmJyaXZvLmNvbS8iLCJzdWIiOiJhdXRoMHw2MTFhOTMzYTE5MjhkOTAwNjgzNGQyNmQiLCJhdWQiOlsiaHR0cHM6Ly9hcGktaW50YS5icml2by5jb20iLCJodHRwczovL2JyaXZvLWludC5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNjM5MDc5OTkzLCJleHAiOjE2MzkwODcxOTMsImF6cCI6Im1YVmdCTldMdlJFVm1qRWVXYmJHbzdVcGtCdEhaY3VqIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCBvZmZsaW5lX2FjY2VzcyIsInBlcm1pc3Npb25zIjpbXX0.i14sgoCNZF72U_wLwJLYslKrdA0E-MjlbKEE4EjN2C1483hwlL5FWVctxTP28Eygm6enQNQP6ELfK-Jl32ulwAEhbwgC-JWgp-Q_EA2KEwGOKmkUieh5Oo4jDYJwqtZWg9I-K52CBQbezRCq2oiyFrrFoIKz3p9ultO759yFfsJncnhNEaupMrA7CV8pSgxkrP9zi6nUv2F3AGkHC1u7OCxrQXhlHdmmtNq69eAP2y9-VG4Rn7TEwg3ttK0uZ6c87AdxmcRGYhZvq56MqjwmmOM0qbkHm6be1sa8VsyjHbGmmIvcFSGtFIMnCAGevnG0venREPgTqv0DeTdOeENPhw");
    addRow("https://supercoolsiteyeah2.awesome.com?email=jaaromy.zierse@gmail.com", "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik5Ea3pNVVJFUXpneVJFUTNOelZGT1RBNVFqbEVSREE0TWtVelJqVTBOek15TnprM01VTTBRdyJ9.eyJodHRwczovL2JyaXZvLmNvbS9vbmFpcl91c2VyX2lkIjoxNjQ5NTQ0LCJodHRwczovL2JyaXZvLmNvbS9hY2NvdW50X2lkIjo1ODcyODMsImh0dHBzOi8vYnJpdm8uY29tL3VzZXJuYW1lIjoiSmFhcm9teUludC5za3ZweiIsImh0dHBzOi8vYnJpdm8uY29tL2VtYWlsIjoiamFhcm9teS56aWVyc2VAYnJpdm8uY29tIiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi1pbnRhLmJyaXZvLmNvbS8iLCJzdWIiOiJhdXRoMHw2MTFhOTMzYTE5MjhkOTAwNjgzNGQyNmQiLCJhdWQiOlsiaHR0cHM6Ly9hcGktaW50YS5icml2by5jb20iLCJodHRwczovL2JyaXZvLWludC5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNjM5MDc5OTkzLCJleHAiOjE2MzkwODcxOTMsImF6cCI6Im1YVmdCTldMdlJFVm1qRWVXYmJHbzdVcGtCdEhaY3VqIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCBvZmZsaW5lX2FjY2VzcyIsInBlcm1pc3Npb25zIjpbXX0.i14sgoCNZF72U_wLwJLYslKrdA0E-MjlbKEE4EjN2C1483hwlL5FWVctxTP28Eygm6enQNQP6ELfK-Jl32ulwAEhbwgC-JWgp-Q_EA2KEwGOKmkUieh5Oo4jDYJwqtZWg9I-K52CBQbezRCq2oiyFrrFoIKz3p9ultO759yFfsJncnhNEaupMrA7CV8pSgxkrP9zi6nUv2F3AGkHC1u7OCxrQXhlHdmmtNq69eAP2y9-VG4Rn7TEwg3ttK0uZ6c87AdxmcRGYhZvq56MqjwmmOM0qbkHm6be1sa8VsyjHbGmmIvcFSGtFIMnCAGevnG0venREPgTqv0DeTdOeENPhw");
    addRow("https://supercoolsiteyeah4.awesome.com?email=jaaromy.zierse@gmail.com", "bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik5Ea3pNVVJFUXpneVJFUTNOelZGT1RBNVFqbEVSREE0TWtVelJqVTBOek15TnprM01VTTBRdyJ9.eyJodHRwczovL2JyaXZvLmNvbS9vbmFpcl91c2VyX2lkIjoxNjQ5NTQ0LCJodHRwczovL2JyaXZvLmNvbS9hY2NvdW50X2lkIjo1ODcyODMsImh0dHBzOi8vYnJpdm8uY29tL3VzZXJuYW1lIjoiSmFhcm9teUludC5za3ZweiIsImh0dHBzOi8vYnJpdm8uY29tL2VtYWlsIjoiamFhcm9teS56aWVyc2VAYnJpdm8uY29tIiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi1pbnRhLmJyaXZvLmNvbS8iLCJzdWIiOiJhdXRoMHw2MTFhOTMzYTE5MjhkOTAwNjgzNGQyNmQiLCJhdWQiOlsiaHR0cHM6Ly9hcGktaW50YS5icml2by5jb20iLCJodHRwczovL2JyaXZvLWludC5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNjM5MDc5OTkzLCJleHAiOjE2MzkwODcxOTMsImF6cCI6Im1YVmdCTldMdlJFVm1qRWVXYmJHbzdVcGtCdEhaY3VqIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCBvZmZsaW5lX2FjY2VzcyIsInBlcm1pc3Npb25zIjpbXX0.i14sgoCNZF72U_wLwJLYslKrdA0E-MjlbKEE4EjN2C1483hwlL5FWVctxTP28Eygm6enQNQP6ELfK-Jl32ulwAEhbwgC-JWgp-Q_EA2KEwGOKmkUieh5Oo4jDYJwqtZWg9I-K52CBQbezRCq2oiyFrrFoIKz3p9ultO759yFfsJncnhNEaupMrA7CV8pSgxkrP9zi6nUv2F3AGkHC1u7OCxrQXhlHdmmtNq69eAP2y9-VG4Rn7TEwg3ttK0uZ6c87AdxmcRGYhZvq56MqjwmmOM0qbkHm6be1sa8VsyjHbGmmIvcFSGtFIMnCAGevnG0venREPgTqv0DeTdOeENPhw");
}, false);

function toConsole(item) {
    devtools.inspectedWindow.eval(
        'console.log("toConsole: " + unescape("' +
        escape(JSON.stringify(item)) + '"))');
}

function addRow(url, token) {
    let tok = cleanUp(token);

    // Double parens around RegExp to get around this issue https://stackoverflow.com/a/68716278
    if (!tok || !((new RegExp(JWT_REGEX).test(tok)))) {
        return;
    }

    if (!jwts[tok]) {
        const decoded = jwt_decode(tok);
        jwts[tok] = { decoded: decoded };
        jwts[tok].targets = {};
        gridOptions.api.applyTransaction({ add: [{ jwt: tok, iss: decoded.iss, iat: decoded.iat, exp: decoded.exp }] });
        autoSizeAll(false);
    }

    if (jwts[tok] && !jwts[tok].targets[url]) {
        jwts[tok].targets[url] = true;
    }    
}

devtools.network.onRequestFinished.addListener(
    function (request) {
        for (const header in request.request.headers) {
            if (Object.hasOwnProperty.call(request.request.headers, header)) {
                const element = request.request.headers[header];

                if (element && element.name && element.name.toLowerCase() === 'authorization') {
                    addRow(request.request.url, element.value);
                }
            }
        }
    }
);
