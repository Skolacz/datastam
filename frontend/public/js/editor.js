const PLATFORM_LIMITS = { linkedin: 3000, twitter: 280, instagram: 2200 };

async function openEditor(postId) {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    const modal = document.getElementById('editor-modal');
    const container = document.getElementById('editor-container');

    modal.classList.remove('hidden');

    // Load the source story so the user can fact-check
    let sourceHtml = '<p>Loading source data...</p>';
    const story = await Api.getStory(post.story_id);

    if (story && story.sections) {
        const section = story.sections.find(s => s.index === post.section_index);
        if (section) {
            const insightsHtml = section.insights
                ? section.insights.map(i => `<li>${escapeHtml(i)}</li>`).join('')
                : '<li>No insights available</li>';

            sourceHtml = `
                <h4>${escapeHtml(story.title)}</h4>
                <p class="source-section-label">Section ${section.index}</p>
                <p>${escapeHtml(section.text || 'No text available.')}</p>
                <strong>Key Insights:</strong>
                <ul>${insightsHtml}</ul>
            `;
        } else {
            sourceHtml = '<p>Source section not found for this post.</p>';
        }
    } else {
        sourceHtml = '<p>Could not load source story.</p>';
    }

    const limit = PLATFORM_LIMITS[post.platform] || 3000;

    container.innerHTML = `
        <div class="editor-split-view">
            <!-- LEFT: Source data for fact-checking -->
            <div class="source-panel">
                <h3>Source Data</h3>
                <p class="source-warning">Verify all numbers match the original data — no hallucinations!</p>
                <div class="source-scroll">
                    ${sourceHtml}
                </div>
            </div>

            <!-- RIGHT: Editable post content -->
            <div class="edit-panel">
                <h3>Edit <span class="platform-badge ${post.platform}">${post.platform}</span> Post</h3>

                <textarea id="edit-area" oninput="updateCharCount('${post.platform}')">${escapeHtml(post.content)}</textarea>
                <div id="char-count" class="char-count"></div>

                <label for="edit-hashtags">Hashtags</label>
                <input type="text" id="edit-hashtags" value="${escapeHtml(post.hashtags || '')}" placeholder="#datastam #data">

                <div class="editor-actions">
                    <button onclick="saveEdit(${post.id})" class="btn-save">Save</button>
                    <button onclick="saveAndApprove(${post.id})" class="btn-approve">Save &amp; Approve</button>
                    <button onclick="closeEditor()" class="btn-cancel">Cancel</button>
                </div>
            </div>
        </div>
    `;

    updateCharCount(post.platform);
}

function updateCharCount(platform) {
    const textarea = document.getElementById('edit-area');
    const countEl = document.getElementById('char-count');
    if (!textarea || !countEl) return;

    const len = textarea.value.length;
    const limit = PLATFORM_LIMITS[platform] || 3000;

    countEl.innerText = `${len} / ${limit} characters`;
    countEl.classList.toggle('over-limit', len > limit);
}

async function saveEdit(id) {
    const content = document.getElementById('edit-area').value;
    const hashtags = document.getElementById('edit-hashtags').value;
    await Api.updatePost(id, { content, hashtags });
    closeEditor();
    await refreshPosts();
}

async function saveAndApprove(id) {
    const content = document.getElementById('edit-area').value;
    const hashtags = document.getElementById('edit-hashtags').value;
    await Api.updatePost(id, { content, hashtags, status: 'approved' });
    closeEditor();
    await refreshPosts();
}

function closeEditor() {
    document.getElementById('editor-modal').classList.add('hidden');
}