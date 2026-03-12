let allPosts = [];

async function initDashboard() {
    const loader = document.getElementById('loader');
    const emptyState = document.getElementById('empty-state');
    const grid = document.getElementById('posts-grid');

    loader.classList.remove('hidden');
    emptyState.classList.add('hidden');
    grid.innerHTML = '';

    allPosts = await Api.getPosts();

    loader.classList.add('hidden');

    if (allPosts.length === 0) {
        emptyState.classList.remove('hidden');
    }

    renderPosts();

    // Listen for filter changes
    document.getElementById('platform-filter').addEventListener('change', renderPosts);
    document.getElementById('status-filter').addEventListener('change', renderPosts);
}

function renderPosts() {
    const platform = document.getElementById('platform-filter').value;
    const status = document.getElementById('status-filter').value;

    const filtered = allPosts.filter(p => {
        const pMatch = platform === 'all' || p.platform === platform;
        const sMatch = status === 'all' || p.status === status;
        return pMatch && sMatch;
    });

    const grid = document.getElementById('posts-grid');
    const emptyState = document.getElementById('empty-state');

    if (filtered.length === 0 && allPosts.length > 0) {
        grid.innerHTML = '<p class="no-results">No posts match these filters.</p>';
        emptyState.classList.add('hidden');
        return;
    }

    grid.innerHTML = filtered.map(post => {
        // Build chart image URL if the post has a chart
        const chartImg = post.chart_index !== null
            ? `<img src="/api/stories/${post.story_id}/charts/${post.chart_index}" alt="Chart" class="post-chart" loading="lazy">`
            : '';

        // Truncate preview text
        const preview = post.content.length > 120
            ? post.content.substring(0, 120) + '...'
            : post.content;

        return `
            <div class="post-card">
                <div class="post-header">
                    <span class="platform-badge ${post.platform}">${post.platform}</span>
                    <span class="status-badge status-${post.status}">${post.status}</span>
                </div>
                ${chartImg}
                <p class="post-content">${escapeHtml(preview)}</p>
                <div class="card-actions">
                    <button class="btn-edit" onclick="openEditor(${post.id})">Edit</button>
                    ${post.status === 'draft' ? `<button class="btn-approve" onclick="quickApprove(${post.id})">Approve</button>` : ''}
                    <button class="btn-delete" onclick="quickDelete(${post.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Quick actions from the dashboard cards
async function quickApprove(id) {
    await Api.approvePost(id);
    await refreshPosts();
}

async function quickDelete(id) {
    if (!confirm('Delete this post?')) return;
    await Api.deletePost(id);
    await refreshPosts();
}

async function refreshPosts() {
    allPosts = await Api.getPosts();
    renderPosts();
}

// Utility: escape HTML to prevent XSS from post content
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.onload = initDashboard;