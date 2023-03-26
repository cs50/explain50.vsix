// Wrap text in a code block
export function codeWrap(languageId: string, text: string) {
    return '```' + languageId + '\n' + text + '\n```\n';
}
