import * as vscode from 'vscode';

// markdown-it plugins for syntax highlighting
const highlightjs = require('markdown-it-highlightjs');
const md = require('markdown-it')();
md.use(highlightjs);

const STATICS_FOLDER = 'statics';

export function createWebviewPanel(context: vscode.ExtensionContext, content: string) {
    const panel = vscode.window.createWebviewPanel(
        'codeAnalysis',
        'Code Analysis',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    const styleUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extension.extensionUri, `${STATICS_FOLDER}/css/style.css`
    ));

    const highlightjsUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extension.extensionUri, `${STATICS_FOLDER}/vendor/highlightjs/11.7.0/highlight.min.js`));

    const highlightStyleUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extension.extensionUri, `${STATICS_FOLDER}/vendor/highlightjs/11.7.0/styles/default.min.css`));

    const parsedContent = parseMarkdown(content);
    const htmlString =
    `<!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
            <link href="${highlightStyleUri}" rel="stylesheet">
            <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
            ${parsedContent}
        </body>
        <script src="${highlightjsUri}"></script>
    </html>`.trim();

    panel.webview.html = htmlString;
}

// parse markdown to html
function parseMarkdown(text: string) {
    return md.render(text);
}
