/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';

// A subset of languages that are supported by VS Code:
// https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers
const supportedLanguages = [
    'clojure', 'c', 'cpp', 'csharp', 'css', 'cuda-cpp', 'dockerfile', 'fsharp', 'go',
    'groovy', 'handlebars', 'html', 'java', 'javascript', 'javascriptreact', 'latex',
    'lua', 'makefile', 'objective-c', 'objective-cpp', 'perl', 'php', 'powershell',
    'python', 'r', 'ruby', 'rust', 'scss', 'shellscript', 'sql', 'swift', 'typescript',
    'typescriptreact', 'tex', 'vb', 'vue', 'vue-html', 'xml', 'yaml'
];

export function activate(context: vscode.ExtensionContext) {
    init(context);
}

function init(context: vscode.ExtensionContext) {

    // Register a code action provider for the typescript and typescriptreact languages.
    let disposable = vscode.languages.registerCodeActionsProvider(
        supportedLanguages,
        {

            // Provide code actions for the given document and range.
            provideCodeActions(document, range) {

                // Create a code action.
                const action = new vscode.CodeAction('Explain Highlighted Code', vscode.CodeActionKind.QuickFix);

                // Set the command that is executed when the code action is selected.
                action.command = {
                    title: 'Explain Highlighted Code',
                    command: 'explain50.explain'
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
    disposable = vscode.commands.registerCommand('explain50.explain', () => {
        explainCode();
    });
    context.subscriptions.push(disposable);
}

// Analyze the selected code snippet or the current function definition
function explainCode() {
    getCodeSnippet()
        .then((result) => {
            const languageId = result[0];
            const codeSnippet = result[1];
            const fileName = result[2];
            const lineStart = result[3];
            const lineEnd = result[4];
            if (codeSnippet.length === 0) {
                vscode.window.showInformationMessage('No code selected or current file is not supported.');
                return;
            }
            try {
                const ddb50 = vscode.extensions.getExtension('cs50.ddb50');
                const api = ddb50!.exports;
                let displayMessage;
                if (lineStart === lineEnd) {
                    displayMessage = `Explain highlighted ${languageId} code for ${fileName}#L${lineStart}`;
                } else {
                    displayMessage = `Explain highlighted ${languageId} code for ${fileName}#L${lineStart}-L${lineEnd}`;
                }
                const payload = {
                    "api": "/api/v1/explain",
                    "config": "chat_cs50",
                    "code": codeSnippet,
                    "language_id": languageId,
                    "stream": true
                };

                // This is the actual message that would end up in messages array for GPT (e.g., for GPT to see the code)
                const contextMessage = `${displayMessage}:\n${codeSnippet}`;
                api.requestGptResponse(displayMessage, contextMessage, payload);
            } catch (error) {
                console.log(error);
            }
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
