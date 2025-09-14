document.addEventListener('DOMContentLoaded', () => {
    const galleryGrid = document.getElementById('gallery-grid');
    const searchBar = document.getElementById('search-bar');
    const sortSelect = document.getElementById('sort-select');

    let allProjects = [];

    const fetchGallery = async () => {
        try {
            const response = await fetch('/gallery');
            allProjects = await response.json();
            renderProjects();
        } catch (error) {
            console.error('Failed to fetch gallery:', error);
            galleryGrid.innerHTML = '<p class="error">Could not load the gallery. Please try again later.</p>';
        }
    };

    const renderProjects = () => {
        let projectsToDisplay = [...allProjects];

        // 1. Filter based on search
        const searchTerm = searchBar.value.toLowerCase();
        if (searchTerm) {
            projectsToDisplay = projectsToDisplay.filter(p => p.prompt.toLowerCase().includes(searchTerm));
        }

        // 2. Sort based on selection
        const sortBy = sortSelect.value;
        if (sortBy === 'newest') {
            projectsToDisplay.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'most-liked') {
            projectsToDisplay.sort((a, b) => b.likes - a.likes);
        } else if (sortBy === 'trending') {
            projectsToDisplay.sort((a, b) => {
                const getScore = (p) => {
                    const hoursAgo = (new Date() - new Date(p.createdAt)) / (1000 * 60 * 60);
                    // Simple trending algorithm: likes divided by age in hours (with a gravity factor)
                    return p.likes / Math.pow(hoursAgo + 2, 1.5);
                };
                return getScore(b) - getScore(a);
            });
        }

        // 3. Render HTML
        galleryGrid.innerHTML = '';
        if (projectsToDisplay.length === 0) {
            galleryGrid.innerHTML = '<p>No projects found matching your criteria.</p>';
        }

        projectsToDisplay.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            
            card.innerHTML = `
                <a href="/view/${project.id}" target="_blank" class="project-preview-link">
                    <div class="project-preview">
                        <iframe srcdoc="${project.code}" scrolling="no" tabindex="-1"></iframe>
                    </div>
                </a>
                <div class="project-info">
                    <h3>${project.prompt.substring(0, 50) + (project.prompt.length > 50 ? '...' : '')}</h3>
                    <div class="project-meta">
                        <span class="like-button" data-id="${project.id}">
                            <svg class="heart-icon" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                            <span class="like-count">${project.likes}</span>
                        </span>
                    </div>
                </div>
            `;
            galleryGrid.appendChild(card);
        });
    };

    galleryGrid.addEventListener('click', async (e) => {
        const likeButton = e.target.closest('.like-button');
        if (likeButton) {
            const toolId = likeButton.dataset.id;
            const likeCountSpan = likeButton.querySelector('.like-count');
            
            try {
                const response = await fetch(`/like/${toolId}`, { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                    likeCountSpan.textContent = data.likes;
                    // Also update the master list
                    const projectInList = allProjects.find(p => p.id === toolId);
                    if(projectInList) projectInList.likes = data.likes;
                }
            } catch (error) {
                console.error('Failed to like post:', error);
            }
        }
    });

    searchBar.addEventListener('input', renderProjects);
    sortSelect.addEventListener('change', renderProjects);

    fetchGallery();
});
