import * as vscode from 'vscode';

// markdown-it plugins for syntax highlighting
const highlightjs = require('markdown-it-highlightjs');
const md = require('markdown-it')();
md.use(highlightjs);

const STATICS_FOLDER = 'statics';
let panel: vscode.WebviewPanel | undefined;

export function createWebviewPanel(context: vscode.ExtensionContext) {
    panel = vscode.window.createWebviewPanel(
        'codeAnalysis',
        'Code Analysis',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = loadingSpinner();
}

export function updateWebviewPanel(context: vscode.ExtensionContext, content: string) {
    if (panel) {
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
}

export function disposeWebview() {
    if (panel) {
        panel.dispose();
    }
}

function loadingSpinner() {
    const html =
    `<!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
            <style>
            .loadingspinner {
                pointer-events: none;
                position: absolute;
                top: 50%;
                left: 50%;
                width: 2.5em;
                height: 2.5em;
                margin-left: -1.25em;
                margin-height -1.25em;
                border: 0.4em solid transparent;
                border-color: var(--vscode-editor-background);;
                border-top-color: var(--vscode-editor-foreground);;
                border-radius: 50%;
                animation: loadingspin 1s linear infinite;
            }

            @keyframes loadingspin {
                100% {
                        transform: rotate(360deg)
                }
            }
        </style>
        </head>
        <body>
            <div class="loadingspinner"></div>
        </body>
    </html>`.trim();
    return html;
}

// parse markdown to html
function parseMarkdown(text: string) {
    return md.render(text);
}
