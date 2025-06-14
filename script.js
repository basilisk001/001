// Ensure the DOM is fully loaded before running scripts
document.addEventListener('DOMContentLoaded', () => {
    // --- AI Assistant Logic ---
    const aiInput = document.getElementById('ai-input');
    const aiSubmit = document.getElementById('ai-submit');
    const aiOutput = document.getElementById('ai-output');
    const aiLoading = document.getElementById('ai-loading');

    if (aiSubmit) { // Check if the AI assistant elements exist
        aiSubmit.addEventListener('click', async () => {
            const prompt = aiInput.value.trim(); // Get user's input and remove whitespace

            if (!prompt) {
                aiOutput.innerHTML = '<p class="error-message">Please enter a question!</p>';
                return;
            }

            aiOutput.innerHTML = '';
            aiLoading.classList.remove('hidden');

            try {
                let chatHistory = [];
                chatHistory.push({ role: "user", parts: [{ text: prompt }] });

                const payload = { contents: chatHistory };
                const apiKey = ""; // API key provided by Canvas environment
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('API Error:', errorData);
                    aiOutput.innerHTML = `<p class="error-message">Error generating response: ${errorData.error?.message || response.statusText}</p>`;
                    return;
                }

                const result = await response.json();

                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    
                    const text = result.candidates[0].content.parts[0].text;
                    aiOutput.innerHTML = `<p>${text.replace(/\n/g, '</p><p>')}</p>`;
                } else {
                    aiOutput.innerHTML = '<p class="error-message">No valid response received from the AI.</p>';
                }

            } catch (error) {
                console.error('Fetch error:', error);
                aiOutput.innerHTML = '<p class="error-message">An unexpected error occurred. Please try again.</p>';
            } finally {
                aiLoading.classList.add('hidden');
            }
        });
    }

    // --- Data Visualization Logic (Chart.js) ---
    const traumaChartCanvas = document.getElementById('traumaChart');
    const chartErrorDiv = document.getElementById('chart-error');

    if (traumaChartCanvas) { // Check if the chart canvas exists
        fetch('TRAUMA - Sheet10.csv') // Assuming the CSV file is in the same directory
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(csvText => {
                // Parse CSV data
                // This is a basic CSV parser. For complex CSVs, consider a library like Papa Parse.
                const lines = csvText.trim().split('\n');
                
                // Assuming the first row is the header and data starts from the 11th row
                // Based on "estimatedRowsAboveHeader":10
                const dataLines = lines.slice(10); // Skip the first 10 lines (header + 9 empty/irrelevant rows)

                const labels = [];
                const values = [];

                dataLines.forEach(line => {
                    const columns = line.split(','); // Adjust delimiter if not comma
                    if (columns.length > 1 && columns[0] && columns[1]) { // Ensure enough columns and data exists
                        // Assuming the first column is the label and the second is the value
                        labels.push(columns[0].trim());
                        values.push(parseFloat(columns[1].trim())); // Convert value to a number
                    }
                });

                // Filter out any NaN values or incomplete rows that might result from parsing
                const filteredData = labels.map((label, index) => ({ label, value: values[index] }))
                                        .filter(item => !isNaN(item.value));

                const finalLabels = filteredData.map(item => item.label);
                const finalValues = filteredData.map(item => item.value);


                if (finalLabels.length === 0 || finalValues.length === 0) {
                    chartErrorDiv.classList.remove('hidden');
                    chartErrorDiv.textContent = 'No valid data found in CSV to create chart. Check CSV format.';
                    return;
                }

                // Create the Chart
                new Chart(traumaChartCanvas, {
                    type: 'bar', // Or 'line', 'pie', etc.
                    data: {
                        labels: finalLabels,
                        datasets: [{
                            label: 'Data Points',
                            data: finalValues,
                            backgroundColor: 'rgba(204, 0, 0, 0.7)', // Red with transparency
                            borderColor: 'rgba(204, 0, 0, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false, // Allows chart to fill container
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Value' // Customize Y-axis title
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Category' // Customize X-axis title
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false // Hide legend for single dataset
                            },
                            title: {
                                display: true,
                                text: 'TRAUMA Data Visualization' // Chart title
                            }
                        }
                    }
                });
            })
            .catch(error => {
                console.error('Error fetching or parsing CSV:', error);
                chartErrorDiv.classList.remove('hidden');
                chartErrorDiv.textContent = `Failed to load or parse data: ${error.message}. Ensure "TRAUMA - Sheet10.csv" is in the correct directory and accessible.`;
            });
    }
});
