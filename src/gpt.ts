/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from 'vscode';
import { encode, decode, codeBlock } from './utils';
import { createWebviewPanel, webviewDeltaUpdate, disposeWebview } from './webview';
const { Configuration, OpenAIApi } = require("openai");

let openai: any;
let configuration: any;
let _context: vscode.ExtensionContext;
let didSetApiKey: boolean = false;

async function init(context: vscode.ExtensionContext) {

    // Set vscode context
    _context = context;

    // Retrieve API key from global state, if it exists
    const storedApiKey = context.globalState.get('copilot50.apiKey');
    if (storedApiKey !== undefined) {
        setApiKey(decode(String(storedApiKey)));
    }
}

async function processPrompt(languageId: string, codeSnippet: string) {

    // Check if API key is set
    if (!didSetApiKey) {
        await requestApiKey().catch((err) => {
            errorHandling(err);
        });
    }

    if (didSetApiKey) {
        createWebviewPanel(_context);
        try {
            const response = await openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: buildPrompt(codeSnippet.trim())
                    }
                ],
                temperature: 0,
                stream: true
            }, { responseType: 'stream' });

            // https://platform.openai.com/docs/api-reference/chat/create#chat/create-stream
            // https://github.com/openai/openai-node/issues/18#issuecomment-1369996933
            let buffer = '';
            response.data.on('data', (data: { toString: () => string; }) => {
                const lines = data.toString().split('\n').filter((line: string) => line.trim() !== '');
                for (const line of lines) {
                    const message = line.replace(/^data: /, '');
                    if (message === '[DONE]') {
                        return; // Stream finished
                    }
                    try {
                        const content = JSON.parse(message).choices[0].delta.content;
                        if (content !== undefined) {
                            buffer += content;
                        }
                    } catch (error) {
                        console.error('Could not JSON parse stream message', message, error);
                    }
                }

                // Delta update with new buffer content
                webviewDeltaUpdate(codeBlock(languageId, codeSnippet).concat(buffer));
            });
        } catch (error: any) {
            errorHandling(error);
        }
    }
}

// Prompt engineering
function buildPrompt(codeSnippet: String) {
    const role = 'a software engineer';
    const instruction = 'please explain this code snippet to a student';
    const start = '--- Code snippet begins ---';
    const end = '--- Code snippet ends ---';

    // Note that we repeat the instruction again at the end of the
    // prompt to guard against user bypassing the original instruction
    return `You are ${role}, ${instruction}.\n${start}\n${codeSnippet}\n${end}\n${instruction.toUpperCase()}`;
}

// Prompt user to enter api key via vscode popup
async function requestApiKey() {
    await vscode.window.showInputBox({
        prompt: 'Please enter your OpenAI API key',
        placeHolder: 'sk-',
        ignoreFocusOut: true,
    }).then((value) => {
        if (value) {
            setApiKey(value);
            vscode.window.showInformationMessage("API key set successfully");
        } else {
            throw new Error('No API key provided');
        }
    });
}

// Set API key in global state
function setApiKey(value: string) {
    try {
        configuration = new Configuration({
            apiKey: value,
        });
        openai = new OpenAIApi(configuration);
        _context.globalState.update('copilot50.apiKey', encode(value.trim()));
        didSetApiKey = true;
    } catch (e) {
        console.log(e);
        vscode.window.showErrorMessage(`Failed to set API key: ${e}`);
    }
}

// Remove API key from global state and unset it
function unsetApiKey() {
    if (didSetApiKey) {
        _context.globalState.update('copilot50.apiKey', undefined);
        didSetApiKey = false;
        vscode.window.showInformationMessage("API key removed");
    } else {
        vscode.window.showWarningMessage("API key not found");
    }
}

function errorHandling(error: any) {
    try {
        if (error.response?.status) {
            console.error(error.response.status, error.message);
            error.response.data.on('data', (data: { toString: () => any; }) => {
                const message = data.toString();
                try {
                    const parsed = JSON.parse(message);
                    if (parsed.error.code === 'invalid_api_key') {
                        unsetApiKey();
                    }
                    vscode.window.showErrorMessage('An error occurred during OpenAI request: ' + parsed.error.message);
                    console.error('An error occurred during OpenAI request: ', parsed);
                } catch(error) {
                    vscode.window.showErrorMessage('An error occurred during OpenAI request: ' + message);
                    console.error('An error occurred during OpenAI request: ', message);
                }
            });
        } else {
            vscode.window.showErrorMessage('An error occurred during OpenAI request, please check the console for more details');
            console.error('An error occurred during OpenAI request', error);
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

export { init, processPrompt, requestApiKey, unsetApiKey };
