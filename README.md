# Copilot50

Copilot50 is a VS Code Extension that utilizes OpenAI's GPT-3.5 model to provide code explanations for learners. It is designed to help students understand the logic behind different code snippets and provide them with relevant information to enhance their programming knowledge.

## Usage
To use Copilot50, select a code snippet in your editor and right-click on it. Then, click the "Explain highlighted code" option from the context menu. Copilot50 will generate a natural language description of the code and provide relevant contextual information.

## Package and Install Extension

```
npm install
./node_modules/vsce/vsce package
code --install-extension cs50-0.0.1.vsix
```

## Requirements
Copilot50 requires an OpenAI API key to function. You can obtain an API key from the OpenAI website: [https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys).
