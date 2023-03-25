const axios = require('axios');

const openai = axios.create({
    baseURL: 'https://api.openai.com/v1',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer OPENAI_API_KEY`
    }});

export async function processPrompt(codeSnippet: String) {
    let response: String = '';
    await openai.post('/chat/completions', {
        'model': 'gpt-3.5-turbo',
        'messages': [{role: 'user', content: `Please explain the following code snippet: ${codeSnippet}`}],
    }).then((res: any) => {
        response = res.data.choices[0]['message']['content'];
    }).catch((err: any) => {
        console.error(err);
    });
    return response;
}
