/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from 'vscode';
import { codeBlock } from './utils';
import { createWebviewPanel, webviewDeltaUpdate, disposeWebview } from './webview';
const axios = require('axios').default;
const https = require('https');

let _context: vscode.ExtensionContext;
let githubUserId: string;

async function init(context: vscode.ExtensionContext) {
    _context = context;
    githubUserId = await getUserId();
}

async function getUserId() {
    const url = 'https://api.github.com/user'
    const headers = {
        'Authorization': `token ${process.env['GITHUB_TOKEN']}`,
        'Accept': 'application/vnd.github.v3+json'
    };
    return await axios.get(url, {headers: headers}).then((response: any) => {
        return response.data.id;
    });
}

async function processPrompt(languageId: string, codeSnippet: string, documentName: string, lineStart: number, lineEnd: number) {
    let panelId = createWebviewPanel(_context, documentName, lineStart, lineEnd);
    try {
        const postData = JSON.stringify({
            "code": codeSnippet,
            "language_id": languageId,
            "stream": true,
            "user": githubUserId || "local_test_user",
        });

        const postOptions = {
            method: 'POST',
            host: 'ai.cs50.io',
            port: 443,
            path: '/code/explain',
            headers: {
                'Authorization': 'TODO',
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
