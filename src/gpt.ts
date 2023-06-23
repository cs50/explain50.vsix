/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from 'vscode';
import { codeBlock } from './utils';
import { createWebviewPanel, webviewDeltaUpdate, disposeWebview } from './webview';
const https = require('https');

let _context: vscode.ExtensionContext;

async function init(context: vscode.ExtensionContext) {
    _context = context;
}

async function processPrompt(languageId: string, codeSnippet: string, documentName: string, lineStart: number, lineEnd: number) {
    let panelId = createWebviewPanel(_context, documentName, lineStart, lineEnd);
    try {
        const postData = JSON.stringify({
            'code': codeSnippet,
            'language_id': languageId,
            'stream': true
        });

        const postOptions = {
            method: 'POST',
            host: 'cs50.ai',
            port: 443,
            path: '/api/v1/explain',
            headers: {
                'Authorization': `Bearer ${process.env['CS50_TOKEN']}`,
                'Content-Type': 'application/json'
            }
        };

        const postRequest = https.request(postOptions, (res: any) => {
            let buffers: string = '';
            res.on('data', (chunk: any) => {
                buffers += chunk;
                webviewDeltaUpdate(panelId, codeBlock(languageId, codeSnippet) + buffers);
            });
        });

        postRequest.write(postData);
        postRequest.end();
    } catch (error: any) {
        errorHandling(error);
    }
}

function errorHandling(error: any) {
    try {
        if (error.response?.status) {
            console.error(error.response.status, error.message);
        } else {
            vscode.window.showErrorMessage('An error occurred please check the console for more details.');
            console.error(error);
        }
    }
    catch (e) {
        vscode.window.showErrorMessage(`Error occurred: ${e}`);
        console.error(e);
    }
    finally {
        disposeWebview();
    }
}

export { init, processPrompt };
