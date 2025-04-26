# Code Iterator Assistant

A lightweight AI-powered code assistant that helps you iterate and improve your code based on natural language prompts.

## Features

- **Code Editor**: Write or paste your code in a syntax-highlighted editor
- **Language Support**: Choose from multiple programming languages
- **AI-Powered Suggestions**: Get intelligent code suggestions based on your prompts
- **One-Click Integration**: Apply suggested changes directly to your code
- **Clear Explanations**: Understand the reasoning behind each suggestion

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the root directory and add your Google Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   You can get a Gemini API key from the [Google AI Studio](https://makersuite.google.com/app/apikey)
4. Run the application:
   ```
   python app.py
   ```
5. Open your browser and navigate to `http://localhost:5000`

## How to Use

1. **Enter Your Code**: Write or paste your code in the code editor
2. **Select Language**: Choose the appropriate programming language
3. **Describe Changes**: Enter a prompt describing what changes you want to make
4. **Generate Suggestions**: Click the "Generate Suggestions" button
5. **Review Suggestions**: Read the explanation and review the suggested code
6. **Integrate Changes**: Click "Integrate Code" to apply the changes to your original code

## Technologies Used

- **Backend**: Flask, Python
- **Frontend**: HTML, CSS, JavaScript
- **Code Editor**: CodeMirror
- **AI**: Google Gemini API

## License

MIT 