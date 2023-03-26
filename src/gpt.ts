/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from 'vscode';
import { encode, decode } from './utils';
import { disposeWebview } from './webview';
const axios = require('axios');

const openai = axios.create({
    baseURL: 'https://api.openai.com/v1',
    headers: {
        'Content-Type': 'application/json'
    }
});

let commandRemoveApiKey: vscode.Disposable;
let _context: vscode.ExtensionContext;
let didSetApiKey: boolean = false;
const anchorPrompt = 'Please explain the following code snippet:';

async function init(context: vscode.ExtensionContext) {

    // Set vscode context
    _context = context;

    // Retrieve API key from global state, if it exists
    const storedApiKey = String(context.globalState.get('copilot50.apiKey'));
    if (storedApiKey) {
        setApiKey(decode(storedApiKey));
    }
}

async function processPrompt(codeSnippet: String) {

    // Check if API key is set
    if (!didSetApiKey) {
        await requestApiKey().catch((err) => {
            errorHandling(err);
        });
    }

    if (didSetApiKey) {
        return await openai.post('/chat/completions', {
            'model': 'gpt-3.5-turbo',
            'messages': [
                {
                    role: 'user',
                    content: `${anchorPrompt}\n${codeSnippet.trim()}`
                }
            ],
        }).then((res: any) => {
            return res.data.choices[0]['message']['content'];
        }).catch((err: any) => {
            errorHandling(err);
        });
    }
    return '';
}

// prompt user to enter api key via vscode popup
async function requestApiKey() {
    await vscode.window.showInputBox({
        prompt: 'Please enter your OpenAI API key',
        placeHolder: 'sk-',
        ignoreFocusOut: true,
    }).then((value) => {
        if (value) {
            setApiKey(value);
        } else {
            throw new Error('No API key provided');
        }
    });
}

function setApiKey(value: string) {
    openai.defaults.headers['Authorization'] = `Bearer ${value.trim()}`;
    _context.globalState.update('copilot50.apiKey', encode(value.trim()));
    didSetApiKey = true;

    // Register a command to remove api key
    commandRemoveApiKey = vscode.commands.registerCommand('copilot50.removeApiKey', () => {
        removeApiKey();
    });
    _context.subscriptions.push(commandRemoveApiKey);
}

function removeApiKey() {
    delete openai.defaults.headers['Authorization'];
    _context.globalState.update('copilot50.apiKey', undefined);
    didSetApiKey = false;
    commandRemoveApiKey.dispose();
}

function errorHandling(err: any) {
    console.log(err);
    try {
        if ('response' in err) {
            const errorResponse = err.response.data['error'];
            console.log(errorResponse);
            vscode.window.showErrorMessage(`Failed to execute request: ${errorResponse['code']}`);
            if (errorResponse['code'] === 'invalid_api_key') {
                vscode.window.showErrorMessage(errorResponse['message']);
                removeApiKey();
            }
        }
    }
    catch (e) {
        console.log(e);
        vscode.window.showErrorMessage(`Unknown error occurred: ${e}`);
    }
    finally {
        disposeWebview();
    }
}

export { init, processPrompt, removeApiKey };
