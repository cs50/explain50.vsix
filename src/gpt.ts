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
    storedApiKey !== undefined ? setApiKey(decode(String(storedApiKey))) : null;
}

async function processPrompt(languageId: string, codeSnippet: string, documentName: string) {

    // Check if API key is set
    if (!didSetApiKey) {
        await requestApiKey().catch((err) => {
            errorHandling(err);
        });
    }

    if (didSetApiKey) {
        createWebviewPanel(_context, documentName);
        try {
            const response = await openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: buildPrompt(languageId, codeSnippet)
                    }
                ],
                temperature: 0,
                stream: true
            }, { responseType: 'stream' });

            // Stream response data

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
                        content !== undefined ? buffer += content : null;
                    } catch (error) {
                        console.error('Could not JSON parse stream message', message, error);
                    }
                }

                // Delta update webview panel with new buffer content
                webviewDeltaUpdate(codeBlock(languageId, codeSnippet).concat(buffer));
            });
        } catch (error: any) {
            errorHandling(error);
        }
    }
}

// Prompt engineering, sets the context for the GPT model to generate a response.
function buildPrompt(languageId: string, codeSnippet: string) {

    // Designate role of model
    const role = 'a software engineer';

    // Tell the model what kind of code snippet it is
    const task = `explain this ${languageId} code snippet to a student`;

    // Special instructions for the model
    const specialInstructions =
        'Make sure to explain the code snippet in plain English, ' +
        'offer code examples as needed, but not solutions. ' +
        'Use proper grammar and punctuation.';

    const start = '--- Code snippet begins ---';
    const end = '--- Code snippet ends ---';

    // Note that we repeat the instruction again at the end of the
    // prompt to guard against user bypassing the original instruction
    const prompt =
        `You are ${role}, ` +
        `${task}.\n` +
        `${start}\n${codeSnippet.trim()}\n${end}\n` +
        `${specialInstructions}\n`;
    console.log(prompt);
    return prompt;
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
