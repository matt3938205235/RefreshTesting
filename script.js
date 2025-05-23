document.addEventListener('DOMContentLoaded', () => {
    const factDisplay = document.getElementById('fact-display');
    const newFactBtn = document.getElementById('new-fact-btn');

    async function fetchRandomFact() {
        factDisplay.textContent = 'Fetching a new fact...';
        try {
            // Make a request to your backend API endpoint
            const response = await fetch('/api/random-fact'); // This URL needs to match your backend route
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            factDisplay.textContent = data.fact;
        } catch (error) {
            console.error('Error fetching the fact:', error);
            factDisplay.textContent = 'Failed to load a fact. Please try again later.';
        }
    }

    // Load a fact when the page is first loaded
    fetchRandomFact();

    // Load a new fact when the button is clicked
    newFactBtn.addEventListener('click', fetchRandomFact);
});
