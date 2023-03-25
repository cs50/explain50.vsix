import * as vscode from 'vscode';

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
                    command: 'copilot50.codeAnalysis',
                    arguments: [selectedEditorText()]
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
        vscode.commands.registerCommand('copilot50.codeAnalysis', (text) => {
            console.log(text);
        }
    ));
}

function selectedEditorText() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        let selection = editor.selection;
        let text = editor.document.getText(selection);
        return text;
    }
    return '';
}

export function deactivate() {}
