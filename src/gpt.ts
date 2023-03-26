/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from 'vscode';
const axios = require('axios');

const openai = axios.create({
    baseURL: 'https://api.openai.com/v1',
    headers: {
        'Content-Type': 'application/json'
    }
});

let didSetApiKey = false;
const anchorPrompt = 'Please explain the following code snippet:';

export async function processPrompt(codeSnippet: String) {
    if (!didSetApiKey) {
        await setApiKey().catch((err: any) => {
            vscode.window.showErrorMessage('Failed to set API key');
            console.error(err);
        });
    }
    if (didSetApiKey) {
        vscode.window.showInformationMessage('Requesting code analysis...');
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
async function setApiKey() {
    await vscode.window.showInputBox({
        prompt: 'Please enter your OpenAI API key',
        placeHolder: 'sk-',
        ignoreFocusOut: true,
    }).then((value) => {
        if (value) {
            openai.defaults.headers['Authorization'] = `Bearer ${value.trim()}`;
            didSetApiKey = true;
        }
        else {
            throw new Error('No API key provided');
        }
    });
}

function errorHandling(err: any) {
    const errorResponse = err.response.data['error'];
    console.log(errorResponse);
    vscode.window.showErrorMessage(`Failed to execute request: ${errorResponse['code']}`);

    if (errorResponse['code'] === 'invalid_api_key') {
        vscode.window.showErrorMessage(errorResponse['message']);
        didSetApiKey = false;
        delete openai.defaults.headers['Authorization'];
    }
}
