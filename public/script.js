document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submit-button');
    const urlInput = document.getElementById('share-url-input');
    const resultContainer = document.getElementById('result-container');

    submitButton.addEventListener('click', async () => {
        const sharedUrl = urlInput.value.trim();
        if (!sharedUrl) {
            resultContainer.innerHTML = `<p class="error">Please paste a URL first.</p>`;
            return;
        }

        resultContainer.innerHTML = `<p class="loading">Processing...</p>`;

        try {
            const response = await fetch('/create-from-share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sharedUrl: sharedUrl }),
            });

            const data = await response.json();

            if (data.success) {
                resultContainer.innerHTML = `
                    <p class="success">Success! Your tool is now permanently hosted at:</p>
                    <a href="${data.link}" target="_blank" class="permanent-link">${data.link}</a>
                `;
            } else {
                resultContainer.innerHTML = `<p class="error">Error: ${data.message}</p>`;
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            resultContainer.innerHTML = `<p class="error">A network error occurred. Please try again.</p>`;
        }
    });
});
