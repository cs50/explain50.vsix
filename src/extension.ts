import * as vscode from 'vscode';
import * as gpt from './gpt';

export function activate(context: vscode.ExtensionContext) {

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
    context.subscriptions.push(
        vscode.commands.registerCommand('copilot50.codeAnalysis', () => {
            selectedEditorText().then((text) => {
                gpt.processPrompt(text).then((response: any) => {
                    if (response.length > 0) {
                        createWebviewPanel(response);
                    }
                });
            });
        }
    ));
}

function createWebviewPanel(content: string) {
    const panel = vscode.window.createWebviewPanel(
        'codeAnalysis',
        'Code Analysis',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );
    panel.webview.html = content;
}

async function selectedEditorText() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        let selection = editor.selection;
        let text = editor.document.getText(selection);

        if (text.length > 0) { return text; }

        if (text.length === 0) {

            // get current line from editor
            const line = editor.document.lineAt(selection.start.line);
            let textLine = line.text;

            // get current function definition from vscode outline
            const outline = vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', editor.document.uri);
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
                return text;
            }
        }
    }
    return '';
}

export function deactivate() { }
