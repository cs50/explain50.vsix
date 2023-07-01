# explain50
explain50 is a VS Code Extension that utilizes OpenAI's GPT model (gpt3.5-turbo) to provide code explanations for learners. It is designed to help students understand the logic behind different code snippets and provide them with relevant information to enhance their programming knowledge.

## Usage
To use explain50, select a code snippet in your editor and right-click on it. Next, click the "Explain highlighted code" option from the context menu. explain50 will then generate a natural language description of the code and provide relevant contextual information.

## Package and Install Extension

```
npm install
./node_modules/.bin/vsce package
code --install-extension explain50-x.x.x
```
