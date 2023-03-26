// Wrap text in a code block
export function codeWrap(languageId: string, text: string) {
    return '```' + languageId + '\n' + text + '\n```\n';
}

// Base64 encode
export function decode (str: string) {
    return String(Buffer.from(str, 'base64').toString('binary'));
}

// Base64 de
export function encode (str: string) {
    return String(Buffer.from(str, 'binary').toString('base64'));
}
