// Ensure the DOM is fully loaded before running scripts
document.addEventListener('DOMContentLoaded', () => {
    // Get references to the HTML elements
    const aiInput = document.getElementById('ai-input');
    const aiSubmit = document.getElementById('ai-submit');
    const aiOutput = document.getElementById('ai-output');
    const aiLoading = document.getElementById('ai-loading');

    // Add event listener to the submit button
    aiSubmit.addEventListener('click', async () => {
        const prompt = aiInput.value.trim(); // Get user's input and remove whitespace

        // Check if the input is empty
        if (!prompt) {
            aiOutput.innerHTML = '<p class="error-message">Please enter a question!</p>';
            return;
        }

        // Clear previous output and show loading indicator
        aiOutput.innerHTML = '';
        aiLoading.classList.remove('hidden');

        try {
            // Prepare the chat history for the API request
            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });

            const payload = { contents: chatHistory };
            
            // The API key is provided by the Canvas environment automatically.
            const apiKey = ""; 
            // Use gemini-2.0-flash for text generation
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            // Make the API call to Gemini
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Check if the request was successful
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                aiOutput.innerHTML = `<p class="error-message">Error generating response: ${errorData.error?.message || response.statusText}</p>`;
                return; // Stop execution on error
            }

            const result = await response.json();

            // Process and display the response
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                
                const text = result.candidates[0].content.parts[0].text;
                // Display the response, converting newlines to paragraphs for better formatting
                aiOutput.innerHTML = `<p>${text.replace(/\n/g, '</p><p>')}</p>`;
            } else {
                aiOutput.innerHTML = '<p class="error-message">No valid response received from the AI.</p>';
            }

        } catch (error) {
            // Handle network or other unexpected errors
            console.error('Fetch error:', error);
            aiOutput.innerHTML = '<p class="error-message">An unexpected error occurred. Please try again.</p>';
        } finally {
            // Hide loading indicator regardless of success or failure
            aiLoading.classList.add('hidden');
        }
    });
});
