// Wrap text in a code block
function codeBlock(languageId: string, text: string) {
    return '```' + languageId + '\n' + text + '\n```\n';
}

// Base64 decoding
function decode (str: string) {
    return String(Buffer.from(str, 'base64').toString('binary'));
}

// Base64 encoding
function encode (str: string) {
    return String(Buffer.from(str, 'binary').toString('base64'));
}

export { codeBlock, decode, encode };
