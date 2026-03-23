/**
 * dashboard.js
 * Loads posts from the API, renders them as cards in the posts grid.
 * handles quick actions (approve, publish, delete)
 *
 */

// Module cache of all posts from last API call.
// renderPosts() filters array client-side for responsiveness
let allPosts = [];

/**
 * Entry point - called once when the page loads (window.onload).
 * Fetches all posts, shows loading indicator while waiting, then renders grid and filter
 */
async function initDashboard() {
    const loader     = document.getElementById('loader');
    const emptyState = document.getElementById('empty-state');
    const grid       = document.getElementById('posts-grid');

    // Show loading text and clear any previous cards
    loader.classList.remove('hidden');
    emptyState.classList.add('hidden');
    grid.innerHTML = '';

    // Fetch all posts
    allPosts = await Api.getPosts();

    loader.classList.add('hidden');

    // If database has no posts, show "capture a story" prompt
    if (allPosts.length === 0) {
        emptyState.classList.remove('hidden');
    }

    renderPosts();

    // Rerender grid whenever filter dropdowns change
    document.getElementById('platform-filter').addEventListener('change', renderPosts);
    document.getElementById('status-filter').addEventListener('change', renderPosts);
}

// Filter allPosts by current dropdown selections, then give card HTML into grid.
function renderPosts() {
    const platform = document.getElementById('platform-filter').value;
    const status   = document.getElementById('status-filter').value;

    // Apply both filters simultaneously
    const filtered = allPosts.filter(p => {
        const pMatch = platform === 'all' || p.platform === platform;
        const sMatch = status   === 'all' || p.status   === status;
        return pMatch && sMatch;
    });

    const grid       = document.getElementById('posts-grid');
    const emptyState = document.getElementById('empty-state');

    // If no results but posts do exist, show "no match" message rather than the full empty state
    if (filtered.length === 0 && allPosts.length > 0) {
        grid.innerHTML = '<p class="no-results">No posts match these filters.</p>';
        emptyState.classList.add('hidden');
        return;
    }

    // always hide empty state when posts exist
    emptyState.classList.add('hidden');

    // Build one card per filtered post and create all at once
    grid.innerHTML = filtered.map(post => {
        const chartImg = post.chart_index != null
            ? `<img src="/api/stories/${post.story_id}/charts/${post.chart_index}"
                    alt="Chart" class="post-chart" loading="lazy">`
            : '';

        // Truncate long posts into short preview
        const preview = post.content.length > 120
            ? post.content.substring(0, 120) + '...'
            : post.content;

        // Approve button only for drafts
        const approveBtn = post.status === 'draft'
            ? `<button class="btn-approve" onclick="quickApprove(${post.id})">Approve</button>`
            : '';

        // Publish button only for approved posts (#48)
        const publishBtn = post.status === 'approved'
            ? `<button class="btn-publish" onclick="quickPublish(${post.id})">Publish</button>`
            : '';

        return `
            <div class="post-card">
                <div class="post-header">
                    <span class="platform-badge ${post.platform}">${post.platform}</span>
                    <span class="status-badge status-${post.status}">${post.status}</span>
                </div>
                ${chartImg}
                <!-- escapeHtml prevents XSS from AI-generated post content -->
                <p class="post-content">${escapeHtml(preview)}</p>
                <div class="card-actions">
                    <button class="btn-edit" onclick="openEditor(${post.id})">Edit</button>
                    ${approveBtn}
                    ${publishBtn}
                    <button class="btn-delete" onclick="quickDelete(${post.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// --- Quick actions (called directly from card buttons) ------------------------

/**
 * Approves draft post directly from dashboard card without opening the editor. 
 * Refreshes grid so status badge updates immediately.
 *
 * @param {number} id - Post id
 */
async function quickApprove(id) {
    await Api.approvePost(id);
    await refreshPosts();
}

/**
 * Publishes approved post to social media platform via buffer
 * Shows confirm dialog first
 *
 * @param {number} id - Post id
 */
async function quickPublish(id) {
    if (!confirm('Publish this post to the platform now?')) return;
    const result = await Api.publishPost(id);
    if (result.error) {
        alert('Publish failed: ' + result.error);
    }
    await refreshPosts();
}

/**
 * Deletes post after confirmation
 * Refreshes grid to remove card.
 *
 * @param {number} id - Post id
 */
async function quickDelete(id) {
    if (!confirm('Delete this post?')) return;
    await Api.deletePost(id);
    await refreshPosts();
}

// Refetches all posts from API and rerenders grid.
async function refreshPosts() {
    allPosts = await Api.getPosts();
    renderPosts();
}

/**
 * Escapes HTML special characters into string to prevent XSS.
 * Used before creating any user-facing or AI-generated text into innerHTML.
 *
 * @param {string} text - Raw text that may contain HTML characters
 * @returns {string}    - Safe HTML string with <, >, &, ", ' escaped
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// generate dashboard as soon as the page finishes loading
window.onload = initDashboard;
