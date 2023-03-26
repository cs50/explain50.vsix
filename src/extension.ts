import * as vscode from 'vscode';
import * as gpt from './gpt';
import { codeWrap } from './utils';
import { createWebviewPanel, updateWebviewPanel } from './webview';

export function activate(context: vscode.ExtensionContext) {
    init(context);
}

function init(context: vscode.ExtensionContext) {

    // Initialize GPT service
    gpt.init(context);

    // Register a code action provider for the typescript and typescriptreact languages.
    let disposable = vscode.languages.registerCodeActionsProvider(
        ['c', 'cpp', 'java', 'javascript', 'python', 'typescript', 'typescriptreact'],
        {

            // Provide code actions for the given document and range.
            provideCodeActions(document, range) {

                // Create a code action.
                const action = new vscode.CodeAction('Explain Highligted Code', vscode.CodeActionKind.QuickFix);

                // Set the command that is executed when the code action is selected.
                action.command = {
                    title: 'Code Analysis',
                    command: 'copilot50.codeAnalysis'
                };

                // Set the diagnostics that this code action resolves.
                action.diagnostics = [];

                // Return the code action.
                return [action];
            }
        }
    );
    context.subscriptions.push(disposable);

    // Register a command that is invoked when the code action is selected
    disposable = vscode.commands.registerCommand('copilot50.codeAnalysis', () => {
        analyzeCode(context);
    });
    context.subscriptions.push(disposable);

    // Register a command to remove api key
    disposable = vscode.commands.registerCommand('copilot50.unsetApiKey', () => {
        gpt.unsetApiKey();
    });
    context.subscriptions.push(disposable);
}

function analyzeCode(context: vscode.ExtensionContext) {
    getCodeSnippet()
    .then((result) => {
        if (result[1].length === 0) {
            vscode.window.showInformationMessage('No code selected or function definition found.');
            return;
        }
        createWebviewPanel(context);
        gpt.processPrompt(result[1]).then((response: any) => {
            if (response && response.length > 0) {
                const codeSnippet = codeWrap(result[0], result[1]);
                updateWebviewPanel(context, codeSnippet + response);
            }
        });
    });
}

// Get the selected text or the current function definition
async function getCodeSnippet() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const languageId = editor.document.languageId;
        let selection = editor.selection;
        let text = editor.document.getText(selection);

        // if text is selected, return it
        if (text.length > 0) { return [languageId, text]; }

        // if no text is selected, get current function definition
        if (text.length === 0) {
            const line = editor.document.lineAt(selection.start.line);
            let textLine = line.text;
            const outline = vscode.commands.executeCommand(
                'vscode.executeDocumentSymbolProvider',
                editor.document.uri
            );

            if (outline) {
                await outline.then((symbols: any) => {
                    for (let i = 0; i < symbols.length; i++) {
                        if (symbols[i].kind === vscode.SymbolKind.Function && textLine.includes(symbols[i].name)) {
                            text = editor.document.getText(symbols[i].range);
                            editor.selection = new vscode.Selection(symbols[i].range.start, symbols[i].range.end);
                            break;
                        }
                    }
                });
                return [languageId, text];
            }
        }
    }

    // if no text is selected and no function definition is found, return empty string
    return ['', ''];
}

export function deactivate() { }
