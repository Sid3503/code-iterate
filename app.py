from flask import Flask, render_template, request, jsonify
import os
import subprocess
import tempfile
import json
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Sample Q&A database
qna_database = {
    'hello': 'Hi there! How can I help you today?',
    'how are you': 'I\'m doing well, thank you for asking! How can I assist you?',
    'what is your name': 'I\'m a Q&A Chatbot, nice to meet you!',
    'bye': 'Goodbye! Have a great day!',
    'help': 'I can answer various questions. Just type your question and I\'ll do my best to help!',
}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/get_response', methods=['POST'])
def get_response():
    data = request.get_json()
    user_message = data.get('message', '').lower().strip()
    
    # Search for the closest matching question
    response = None
    for question in qna_database:
        if question in user_message:
            response = qna_database[question]
            break
    
    if response is None:
        response = "I'm not sure about that. Could you please rephrase your question?"
    
    return jsonify({'response': response})

@app.route('/run_code', methods=['POST'])
def run_code():
    data = request.get_json()
    code = data.get('code', '')
    language = data.get('language', '')
    
    if not code or not language:
        return jsonify({'error': 'Code and language are required'}), 400
    
    try:
        # Create a temporary file to store the code
        with tempfile.NamedTemporaryFile(delete=False, suffix=get_file_extension(language)) as temp_file:
            temp_file.write(code.encode('utf-8'))
            temp_file_path = temp_file.name
        
        # Run the code based on the language
        if language == 'python':
            result = subprocess.run(['python', temp_file_path], capture_output=True, text=True, timeout=5)
        elif language == 'javascript':
            # For JavaScript, we'll use Node.js
            result = subprocess.run(['node', temp_file_path], capture_output=True, text=True, timeout=5)
        elif language == 'c':
            # For C, we need to compile first
            compiled_file = temp_file_path + '.exe' if os.name == 'nt' else temp_file_path + '.out'
            compile_result = subprocess.run(['gcc', temp_file_path, '-o', compiled_file], capture_output=True, text=True)
            
            if compile_result.returncode != 0:
                return jsonify({'error': f'Compilation error: {compile_result.stderr}'}), 400
            
            # Run the compiled program
            result = subprocess.run([compiled_file], capture_output=True, text=True, timeout=5)
            
            # Clean up the compiled file
            try:
                os.remove(compiled_file)
            except:
                pass
        elif language == 'cpp':
            # For C++, we need to compile first
            compiled_file = temp_file_path + '.exe' if os.name == 'nt' else temp_file_path + '.out'
            compile_result = subprocess.run(['g++', temp_file_path, '-o', compiled_file], capture_output=True, text=True)
            
            if compile_result.returncode != 0:
                return jsonify({'error': f'Compilation error: {compile_result.stderr}'}), 400
            
            # Run the compiled program
            result = subprocess.run([compiled_file], capture_output=True, text=True, timeout=5)
            
            # Clean up the compiled file
            try:
                os.remove(compiled_file)
            except:
                pass
        elif language == 'java':
            # For Java, we need to compile first
            # Extract class name from the code
            class_name = None
            for line in code.split('\n'):
                if 'public class' in line:
                    class_name = line.split('public class')[1].split('{')[0].strip()
                    break
            
            if not class_name:
                return jsonify({'error': 'Could not find a public class in the Java code'}), 400
            
            # Compile the Java code
            compile_result = subprocess.run(['javac', temp_file_path], capture_output=True, text=True)
            
            if compile_result.returncode != 0:
                return jsonify({'error': f'Compilation error: {compile_result.stderr}'}), 400
            
            # Run the compiled Java program
            class_file = os.path.join(os.path.dirname(temp_file_path), f"{class_name}.class")
            result = subprocess.run(['java', '-cp', os.path.dirname(temp_file_path), class_name], capture_output=True, text=True, timeout=5)
            
            # Clean up the compiled files
            try:
                os.remove(class_file)
            except:
                pass
        else:
            return jsonify({'error': f'Language {language} is not supported for execution'}), 400
        
        # Clean up the temporary file
        try:
            os.remove(temp_file_path)
        except:
            pass
        
        # Return the output
        output = result.stdout if result.returncode == 0 else result.stderr
        return jsonify({'output': output})
    
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Code execution timed out'}), 408
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_file_extension(language):
    extension_map = {
        'python': '.py',
        'javascript': '.js',
        'c': '.c',
        'cpp': '.cpp',
        'java': '.java'
    }
    return extension_map.get(language, '.txt')

@app.route('/iterate_code', methods=['POST'])
def iterate_code():
    data = request.get_json()
    code = data.get('code', '')
    prompt = data.get('prompt', '')
    
    if not code or not prompt:
        return jsonify({'error': 'Code and prompt are required'}), 400
    
    try:
        # Get the Gemini model
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Create the prompt for code iteration
        full_prompt = f"""You are a code assistant that helps improve and modify code based on user requests.
        
Here is the code:
```
{code}
```

I want to: {prompt}

Please provide the modified code with explanations of the changes. Format your response with the explanation first, followed by the code in a code block. If this is a dry run request, focus on providing a detailed, structured analysis with clear sections, tables for variable tracking, and specific examples of execution flow."""

        # Generate content with Gemini
        response = model.generate_content(full_prompt)
        
        # Extract the response text
        response_text = response.text
        
        # Split the response into explanation and code
        parts = response_text.split("```")
        
        explanation = parts[0].strip()
        modified_code = ""
        
        # Extract code from the response
        if len(parts) > 1:
            code_parts = parts[1].split("\n", 1)
            if len(code_parts) > 1:
                modified_code = code_parts[1].strip()
        
        return jsonify({
            'explanation': explanation,
            'modified_code': modified_code
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# For local development
if __name__ == '__main__':
    app.run(debug=True)

# For Vercel
app = app 