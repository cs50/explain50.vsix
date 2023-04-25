import * as vscode from 'vscode';
import * as gpt from './gpt';

const supportedLanguages = ['c', 'cpp', 'java', 'javascript', 'python', 'typescript', 'typescriptreact'];

export function activate(context: vscode.ExtensionContext) {
    init(context);
}

function init(context: vscode.ExtensionContext) {

    // Initialize GPT service
    gpt.init(context);

    // Register a code action provider for the typescript and typescriptreact languages.
    let disposable = vscode.languages.registerCodeActionsProvider(
        supportedLanguages,
        {

            // Provide code actions for the given document and range.
            provideCodeActions(document, range) {

                // Create a code action.
                const action = new vscode.CodeAction('Explain highligted code', vscode.CodeActionKind.QuickFix);

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
        analyzeCode();
    });
    context.subscriptions.push(disposable);

    // Register a command to set api key
    disposable = vscode.commands.registerCommand('copilot50.setApiKey', () => {
        gpt.requestApiKey();
    });
    context.subscriptions.push(disposable);

    // Register a command to remove api key
    disposable = vscode.commands.registerCommand('copilot50.unsetApiKey', () => {
        gpt.unsetApiKey();
    });
    context.subscriptions.push(disposable);
}

// Analyze the selected code snippet or the current function definition
function analyzeCode() {
    getCodeSnippet()
        .then((result) => {
            const languageId = result[0];
            const text = result[1];
            const fileName = result[2];
            const start = result[3];
            const end = result[4];
            if (text.length === 0) {
                vscode.window.showInformationMessage('No code selected or current file is not supported.');
                return;
            }
            gpt.processPrompt(languageId, text, fileName, start, end);
        });
}

// Get the selected text or the current function definition
async function getCodeSnippet(): Promise<[string, string, string, number, number]> {
    const editor = vscode.window.activeTextEditor;
    if (editor && supportedLanguages.includes(editor.document.languageId)) {
        const languageId = editor.document.languageId;
        let selection = editor.selection;
        let text = editor.document.getText(selection);
        const fileName = editor.document.fileName.split('/').pop() || '';

        // If text is selected, return it
        if (text.length > 0) {
            return [languageId, beautify(text), fileName, editor.selection.start.line + 1, editor.selection.end.line + 1];
        }

        // If no text is selected, get current function definition
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

                // remove all spaces on the right
                return [languageId, beautify(text), fileName, editor.selection.start.line + 1, editor.selection.end.line + 1];
            }
        }
    }

    // If no text is selected and no function definition is found, return empty string
    return ['', '', '', 0, 0];
}

function beautify(text: string): string {
    let lines = text.split('\n');
    let minIndentation = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.trim().length > 0) {
            let indentation = line.search(/\S/);
            if (indentation >= 0 && indentation < minIndentation) {
                minIndentation = indentation;
            }
        }
    }
    let trimmedLines = [];
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.trim().length > 0) {
            trimmedLines.push(line.substring(minIndentation));
        } else {
            trimmedLines.push('');
        }
    }
    return trimmedLines.join('\n').replace(/\s+$/g, '');
}

export function deactivate() { }
