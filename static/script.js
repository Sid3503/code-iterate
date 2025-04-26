document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const codeEditor = document.getElementById('codeEditor');
    const suggestedCodeEditor = document.getElementById('suggestedCodeEditor');
    const promptInput = document.getElementById('promptInput');
    const generateButton = document.getElementById('generateButton');
    const integrateButton = document.getElementById('integrateButton');
    const languageSelect = document.getElementById('languageSelect');
    const suggestionsSection = document.getElementById('suggestionsSection');
    const explanationText = document.getElementById('explanationText');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const runButton = document.getElementById('runButton');
    const outputText = document.getElementById('outputText');
    
    // CodeMirror instances
    let codeMirrorInstance;
    let suggestedCodeMirrorInstance;
    
    // Track if user has modified the code
    let userModifiedCode = false;
    
    // Initialize CodeMirror for the code editor
    function initCodeEditor() {
        const mode = getLanguageMode(languageSelect.value);
        codeMirrorInstance = CodeMirror.fromTextArea(codeEditor, {
            mode: mode,
            theme: 'monokai',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 4,
            tabSize: 4,
            lineWrapping: true,
            extraKeys: {"Ctrl-Space": "autocomplete"}
        });
        
        // Add subtle animation when editor is ready
        setTimeout(() => {
            document.querySelector('.code-editor-container').style.opacity = '1';
            document.querySelector('.code-editor-container').style.transform = 'translateY(0)';
        }, 100);
        
        // Set initial sample code
        codeMirrorInstance.setValue(getSampleCode(languageSelect.value));
    }
    
    // Initialize CodeMirror for the suggested code editor
    function initSuggestedCodeEditor() {
        const mode = getLanguageMode(languageSelect.value);
        suggestedCodeMirrorInstance = CodeMirror.fromTextArea(suggestedCodeEditor, {
            mode: mode,
            theme: 'monokai',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 4,
            tabSize: 4,
            lineWrapping: true,
            readOnly: true
        });
        
        // Add subtle animation when editor is ready
        setTimeout(() => {
            const container = suggestedCodeMirrorInstance.getWrapperElement();
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // Get the appropriate CodeMirror mode based on language
    function getLanguageMode(language) {
        const modeMap = {
            'javascript': 'javascript',
            'python': 'python',
            'c': 'text/x-csrc',
            'cpp': 'text/x-c++src',
            'java': 'text/x-java'
        };
        return modeMap[language] || 'javascript';
    }
    
    // Get sample code based on language
    function getSampleCode(language) {
        const sampleCodeMap = {
            'javascript': `// Sample JavaScript code
function calculateSum(numbers) {
    let sum = 0;
    for (let i = 0; i < numbers.length; i++) {
        sum += numbers[i];
    }
    return sum;
}

const numbers = [1, 2, 3, 4, 5];
console.log(calculateSum(numbers));`,
            'python': `# Sample Python code
def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total

numbers = [1, 2, 3, 4, 5]
print(calculate_sum(numbers))`,
            'c': `// Sample C code
#include <stdio.h>

int calculateSum(int numbers[], int size) {
    int sum = 0;
    for (int i = 0; i < size; i++) {
        sum += numbers[i];
    }
    return sum;
}

int main() {
    int numbers[] = {1, 2, 3, 4, 5};
    int size = sizeof(numbers) / sizeof(numbers[0]);
    printf("%d\\n", calculateSum(numbers, size));
    return 0;
}`,
            'cpp': `// Sample C++ code
#include <iostream>
#include <vector>

int calculateSum(const std::vector<int>& numbers) {
    int sum = 0;
    for (int num : numbers) {
        sum += num;
    }
    return sum;
}

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    std::cout << calculateSum(numbers) << std::endl;
    return 0;
}`,
            'java': `// Sample Java code
public class Calculator {
    public static int calculateSum(int[] numbers) {
        int sum = 0;
        for (int number : numbers) {
            sum += number;
        }
        return sum;
    }

    public static void main(String[] args) {
        int[] numbers = {1, 2, 3, 4, 5};
        System.out.println(calculateSum(numbers));
    }
}`
        };
        return sampleCodeMap[language] || sampleCodeMap['javascript'];
    }
    
    // Update CodeMirror mode when language changes
    languageSelect.addEventListener('change', () => {
        const mode = getLanguageMode(languageSelect.value);
        
        // Update the mode for both editors
        codeMirrorInstance.setOption('mode', mode);
        if (suggestedCodeMirrorInstance) {
            suggestedCodeMirrorInstance.setOption('mode', mode);
        }
        
        // Only update the code content if user hasn't modified it
        if (!userModifiedCode) {
            codeMirrorInstance.setValue(getSampleCode(languageSelect.value));
        }
    });
    
    // Run code and display output
    async function runCode() {
        const code = codeMirrorInstance.getValue();
        const language = languageSelect.value;
        
        if (!code) {
            outputText.textContent = "No code to run.";
            return;
        }
        
        // Show loading state
        outputText.textContent = "Running code...";
        
        try {
            const response = await fetch('/run_code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    code, 
                    language 
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                outputText.textContent = data.output || "No output.";
            } else {
                outputText.textContent = `Error: ${data.error || 'Failed to run code'}`;
            }
        } catch (error) {
            console.error('Error:', error);
            outputText.textContent = "An error occurred while running the code. Please try again.";
        }
    }
    
    // Generate code suggestions
    async function generateSuggestions() {
        const code = codeMirrorInstance.getValue();
        const prompt = promptInput.value.trim();
        
        if (!code) {
            alert('Please enter some code first.');
            return;
        }
        
        if (!prompt) {
            alert('Please describe what changes you want to make.');
            return;
        }
        
        // Show loading overlay with fade-in animation
        loadingOverlay.style.display = 'flex';
        setTimeout(() => {
            loadingOverlay.style.opacity = '1';
        }, 10);
        
        try {
            // Enhance prompt for dry runs
            let enhancedPrompt = prompt;
            if (prompt.toLowerCase().includes('dry run')) {
                enhancedPrompt = `Please perform a detailed dry run of the following code, explaining:

## 1. Code Overview
- Provide a brief overview of what the code does
- Identify the main components (classes, functions, etc.)

## 2. Step-by-Step Execution
- Walk through the code line by line
- Explain what happens at each significant step
- For loops, show the state at each iteration
- For function calls, explain the parameters and return values

## 3. Variable State Tracking
- Create a table showing how key variables change throughout execution
- Include all relevant variables and their values at each step

## 4. Memory Analysis
- Explain memory allocation and usage
- Track object creation and references
- Note any potential memory issues

## 5. Performance Analysis
- Identify time complexity of algorithms
- Note any potential performance bottlenecks
- Suggest optimizations if applicable

## 6. Edge Cases and Potential Issues
- Identify potential edge cases the code might not handle
- Note any assumptions made in the code
- Suggest improvements for robustness

Code to analyze:
\`\`\`
${code}
\`\`\`

Original request: ${prompt}`;
            }
            
            const response = await fetch('/iterate_code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    code, 
                    prompt: enhancedPrompt,
                    language: languageSelect.value 
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Display explanation
                explanationText.innerHTML = formatExplanation(data.explanation);
                
                // Show suggestions section with animation
                suggestionsSection.style.display = 'block';
                suggestionsSection.style.opacity = '1';
                suggestionsSection.style.transform = 'translateY(0)';
                
                // Store the modified code for integration
                window.lastModifiedCode = data.modified_code;
            } else {
                alert(`Error: ${data.error || 'Failed to generate suggestions'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while generating suggestions. Please try again.');
        } finally {
            // Hide loading overlay with fade-out animation
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }
    }
    
    // Format explanation text with line breaks and markdown conversion
    function formatExplanation(text) {
        // First replace newlines with <br> tags
        let formattedText = text.replace(/\n/g, '<br>');
        
        // Convert markdown tables to HTML tables
        formattedText = formattedText.replace(/\|([^\n]*)\|/g, function(match) {
            // Check if this is a table header separator (contains only dashes and pipes)
            if (match.match(/^[\|\s\-]+$/)) {
                return '';
            }
            
            // Process table rows
            const cells = match.split('|').filter(cell => cell.trim() !== '');
            return '<tr>' + cells.map(cell => `<td>${cell.trim()}</td>`).join('') + '</tr>';
        });
        
        // Wrap tables in table tags
        formattedText = formattedText.replace(/<tr>.*?<\/tr>/g, function(match) {
            return '<table class="markdown-table">' + match + '</table>';
        });
        
        // Convert markdown bold to HTML bold
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert markdown italic to HTML italic
        formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Convert markdown code blocks to HTML code blocks
        formattedText = formattedText.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Convert markdown inline code to HTML inline code
        formattedText = formattedText.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Convert markdown lists to HTML lists
        formattedText = formattedText.replace(/\* (.*?)(<br>|$)/g, '<li>$1</li>$2');
        formattedText = formattedText.replace(/<li>.*?<\/li>/g, function(match) {
            return '<ul>' + match + '</ul>';
        });
        
        return formattedText;
    }
    
    // Integrate suggested code into the original editor
    function integrateCode() {
        if (!window.lastModifiedCode) return;
        
        codeMirrorInstance.setValue(window.lastModifiedCode);
        
        // Mark that user has modified the code
        userModifiedCode = true;
        
        // Hide suggestions section with animation
        suggestionsSection.style.opacity = '0';
        suggestionsSection.style.transform = 'translateY(20px)';
        setTimeout(() => {
            suggestionsSection.style.display = 'none';
        }, 300);
        
        // Clear prompt
        promptInput.value = '';
    }
    
    // Event listeners
    generateButton.addEventListener('click', generateSuggestions);
    integrateButton.addEventListener('click', integrateCode);
    runButton.addEventListener('click', runCode);
    
    // Initialize editors
    initCodeEditor();
});