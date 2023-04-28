import * as vscode from 'vscode';

// markdown-it plugins for syntax highlighting
const highlightjs = require('markdown-it-highlightjs');
const md = require('markdown-it')();
md.use(highlightjs);

const STATICS_FOLDER = 'statics';
let panels: any = [];

function createWebviewPanel(context: vscode.ExtensionContext, documentName: string, lineStart: number, lineEnd: number) {
    let panelTitle;
    if (lineStart === lineEnd) {
        panelTitle = `Explain ${documentName}#L${lineStart}`;
    } else {
        panelTitle = `Explain ${documentName}#L${lineStart}-L${lineEnd}`;
    }

    let panel = vscode.window.createWebviewPanel(
        'explain',
        panelTitle,
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    let styleUri;
    let highlightStyleUri;
    let lightTheme = [vscode.ColorThemeKind.Light, vscode.ColorThemeKind.HighContrastLight];
    const isLightTheme = lightTheme.includes(vscode.window.activeColorTheme.kind);
    if (isLightTheme) {
        styleUri = panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extension.extensionUri, `${STATICS_FOLDER}/css/light.css`
        ));
        highlightStyleUri = panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extension.extensionUri, `${STATICS_FOLDER}/vendor/highlightjs/11.7.0/styles/github.min.css`));
    } else {
        styleUri = panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extension.extensionUri, `${STATICS_FOLDER}/css/dark.css`
        ));
        highlightStyleUri = panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extension.extensionUri, `${STATICS_FOLDER}/vendor/highlightjs/11.7.0/styles/github-dark.min.css`));
    }

    const scriptUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extension.extensionUri, `${STATICS_FOLDER}/js/index.js`));

    const highlightjsUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extension.extensionUri, `${STATICS_FOLDER}/vendor/highlightjs/11.7.0/highlight.min.js`));

    const htmlString =
    `<!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
            <link href="${highlightStyleUri}" rel="stylesheet">
            <link href="${styleUri}" rel="stylesheet">
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
            <div id="delta">
                <div class="loadingspinner"></div>
            </div>
        </body>
        <script src="${highlightjsUri}"></script>
        <script src="${scriptUri}"></script>
    </html>`.trim();
    panel.webview.html = htmlString;
    panels?.push(panel);
    return panels.length - 1;
}

function webviewDeltaUpdate(id: number, content: string) {
    if (panels[id]) {
        panels[id].webview.postMessage(
            {
                command: 'delta_update',
                content: md.render(content)
            });
    }
}

function disposeWebview() {
    panels.forEach((panel: any) => {
        panel.dispose();
    });
    panels = [];
}

export { createWebviewPanel, webviewDeltaUpdate, disposeWebview };
