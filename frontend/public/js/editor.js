/**
 * editor.js
 * Handles the post editor menu
 */

// --- Platform character limits ------------------------
const PLATFORM_LIMITS = {
    linkedin:  3000,
    twitter:   280,
    instagram: 2200
};

/**
 * Opens editor menu for selected post
 * Fetches parent story from the API so the user can fact-check numbers in the AI-generated content against the original source data.
 *
 * @param {number} postId - The id of the post to edit (matches posts.id in DB)
 */
async function openEditor(postId) {
    // Look up post from loaded allPosts array to avoid an extra API call
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    const modal     = document.getElementById('editor-modal');
    const container = document.getElementById('editor-container');

    // clear stale content immediately so previous post's data appear when new story is being fetched
    container.innerHTML = '<p style="padding:20px;color:#aeb9ce;">Loading editor...</p>';
    modal.classList.remove('hidden');

    // -- Build the source panel (left side) ----------------------------------------
    // Fetch the full story
    let sourceHtml = '<p>Could not load source story.</p>';
    const story = await Api.getStory(post.story_id);

    if (story && story.sections) {
        // Find specific section this post was generated from
        const section = story.sections.find(s => s.index === post.section_index);

        if (section) {
            // Build bullet point list of key insights
            const insightsHtml = section.insights
                ? section.insights.map(i => `<li>${escapeHtml(i)}</li>`).join('')
                : '<li>No insights available</li>';

            // show the chart associated with this post in the source panel
            const chartHtml = post.chart_index != null
                ? `<div style="margin-top:14px;">
                       <p class="source-section-label">Chart ${post.chart_index}</p>
                       <img src="/api/stories/${post.story_id}/charts/${post.chart_index}"
                            alt="Chart ${post.chart_index}"
                            style="width:100%;border-radius:4px;margin-top:6px;background:#161920;">
                   </div>`
                : '';

            sourceHtml = `
                <h4>${escapeHtml(story.title)}</h4>
                <p class="source-section-label">Section ${section.index}</p>
                <p>${escapeHtml(section.text || 'No text available.')}</p>
                <strong>Key Insights:</strong>
                <ul>${insightsHtml}</ul>
                ${chartHtml}
            `;
        } else {
            sourceHtml = '<p>Source section not found for this post.</p>';
        }
    }

    // "Save & Publish" only appears for already-approved posts
    const publishBtn = post.status === 'approved'
        ? `<button onclick="saveAndPublish(${post.id})" class="btn-publish">Save &amp; Publish</button>`
        : '';

    // -- Render editor layout ---------------------------------
    container.innerHTML = `
        <div class="editor-split-view">

            <!-- LEFT: Source data — used to fact-check AI-generated content -->
            <div class="source-panel">
                <h3>Source Data</h3>
                <p class="source-warning">Verify all numbers match the original data — no hallucinations!</p>
                <div class="source-scroll">
                    ${sourceHtml}
                </div>
            </div>

            <!-- RIGHT: Editable post content + live platform preview -->
            <div class="edit-panel">
                <h3>Edit <span class="platform-badge ${post.platform}">${post.platform}</span> Post</h3>

                <!-- Textarea: oninput triggers both char counter and preview update -->
                <textarea id="edit-area"
                          oninput="onEditInput('${post.platform}')">${escapeHtml(post.content)}</textarea>

                <!-- Live character counter — turns red when over limit (#37) -->
                <div id="char-count" class="char-count"></div>

                <label for="edit-hashtags">Hashtags</label>
                <input type="text" id="edit-hashtags"
                       oninput="updatePreview('${post.platform}')"
                       value="${escapeHtml(post.hashtags || '')}"
                       placeholder="#datastam #data">

                <!-- Action buttons: Save | Save & Approve | (Save & Publish) | Cancel -->
                <div class="editor-actions">
                    <button onclick="saveEdit(${post.id})" class="btn-save">Save</button>
                    <button onclick="saveAndApprove(${post.id})" class="btn-approve">Save &amp; Approve</button>
                    ${publishBtn}
                    <button onclick="closeEditor()" class="btn-cancel">Cancel</button>
                </div>

                <!-- Feature #38: Live platform preview mockup -->
                <div class="preview-section">
                    <p class="source-section-label" style="margin-bottom:10px;">Preview</p>
                    <div id="platform-preview"></div>
                </div>
            </div>

        </div>
    `;

    // Initialise counter and preview
    updateCharCount(post.platform);
    updatePreview(post.platform);
}

/**
 * Combined input handler - called on every keystroke 
 * Keeps the character counter and preview in sync
 *
 * @param {string} platform - 'linkedin' | 'twitter' | 'instagram'
 */
function onEditInput(platform) {
    updateCharCount(platform);
    updatePreview(platform);
}

/**
 * Updates the character counter below the textarea
 * Adds the 'over-limit' CSS class (red text) when the post exceeds platform's character limit.
 *
 * @param {string} platform - 'linkedin' | 'twitter' | 'instagram'
 */
function updateCharCount(platform) {
    const textarea = document.getElementById('edit-area');
    const countEl  = document.getElementById('char-count');
    if (!textarea || !countEl) return;

    const len   = textarea.value.length;
    const limit = PLATFORM_LIMITS[platform] || 3000;

    countEl.innerText = `${len} / ${limit} characters`;
    countEl.classList.toggle('over-limit', len > limit);
}

/**
 * Renders mockup showing how current text will appear on target platform
 *
 * LinkedIn  - professional card with profile, body text, and reaction bar
 * Twitter/X - tweet card. long text is automatically split into a thread
 * Instagram - photo post card with image placeholder, caption, and hashtags
 *
 * preview updates live on every keystroke via onEditInput().
 *
 * @param {string} platform - 'linkedin' | 'twitter' | 'instagram'
 */
function updatePreview(platform) {
    const textarea      = document.getElementById('edit-area');
    const hashtagsInput = document.getElementById('edit-hashtags');
    const previewEl     = document.getElementById('platform-preview');
    if (!textarea || !previewEl) return;

    const text     = textarea.value;
    const hashtags = hashtagsInput ? hashtagsInput.value.trim() : '';
    // Combine body text and hashtags into one string 
    const fullText = hashtags ? `${text}\n\n${hashtags}` : text;

    let previewHtml = '';

    // -- LinkedIn preview ------------------------------------
    if (platform === 'linkedin') {
        previewHtml = `
            <div class="preview-linkedin">
                <div class="preview-profile">
                    <div class="preview-avatar">D</div>
                    <div>
                        <div class="preview-name">Datastam</div>
                        <div class="preview-meta">Data Analytics · Just now · 🌐</div>
                    </div>
                </div>
                <div class="preview-body">${escapeHtml(fullText)}</div>
                <div class="preview-actions">
                    <span>👍 Like</span>
                    <span>💬 Comment</span>
                    <span>🔁 Repost</span>
                    <span>📤 Send</span>
                </div>
            </div>`;

    // -- Twitter/X preview ------------------------------------------------
    } else if (platform === 'twitter') {
        // Twitter has 280 char limit - split long text into a thread
        const tweets     = splitIntoTweets(text, PLATFORM_LIMITS.twitter);
        const tweetsHtml = tweets.map((tweet, i) => `
            <div class="preview-tweet${i > 0 ? ' preview-tweet-reply' : ''}">
                <div class="preview-tweet-row">
                    <div class="preview-avatar preview-avatar-twitter">D</div>
                    <div class="preview-tweet-content">
                        <div>
                            <span class="preview-name">Datastam</span>
                            <span class="preview-handle">@datastam · now</span>
                        </div>
                        <!-- Append hashtags only to the first tweet -->
                        <div class="preview-body">${escapeHtml(tweet)}${
                            i === 0 && hashtags ? '\n\n' + escapeHtml(hashtags) : ''
                        }</div>
                        <div class="preview-actions preview-actions-twitter">
                            <span>💬</span><span>🔁</span><span>❤️</span><span>📊</span><span>📤</span>
                        </div>
                    </div>
                </div>
            </div>`
        ).join('');

        previewHtml = `<div class="preview-twitter">${tweetsHtml}</div>`;

    // -- Instagram preview ----------------------------------------------
    } else if (platform === 'instagram') {
        previewHtml = `
            <div class="preview-instagram">
                <div class="preview-ig-header">
                    <div class="preview-profile">
                        <div class="preview-avatar preview-avatar-ig">D</div>
                        <span class="preview-name">datastam</span>
                    </div>
                    <span class="preview-ig-dots">···</span>
                </div>
                <!-- Placeholder for the chart image that Buffer will attach -->
                <div class="preview-ig-image">
                    <span>📊 Chart Image</span>
                </div>
                <div class="preview-ig-actions">
                    <span>🤍</span><span>✈️</span><span>🔖</span>
                </div>
                <div class="preview-body preview-ig-caption">
                    <strong>datastam</strong> ${escapeHtml(fullText)}
                </div>
            </div>`;
    }

    previewEl.innerHTML = previewHtml;
}

/**
 * Splits long text string into an array of appropriate chunks.
 * tries to break at spaces
 *
 * @param {string} text   - The full body to split
 * @param {number} maxLen - Maximum characters per tweet (280)
 * @returns {string[]}    - Array of tweet strings
 */
function splitIntoTweets(text, maxLen) {
    // if short enough - return as is
    if (text.length <= maxLen) return [text];

    const tweets = [];
    let remaining = text.trim();

    while (remaining.length > maxLen) {
        // Find last space within the limit
        let cutAt = remaining.lastIndexOf(' ', maxLen);
        if (cutAt === -1) cutAt = maxLen; // No space found - cut
        tweets.push(remaining.substring(0, cutAt).trim());
        remaining = remaining.substring(cutAt).trim();
    }
    if (remaining) tweets.push(remaining);
    return tweets;
}

/**
 * Saves current textarea content and hashtags without changing post status
 * called by "Save" button.
 *
 * @param {number} id - Post id
 */
async function saveEdit(id) {
    const content  = document.getElementById('edit-area').value;
    const hashtags = document.getElementById('edit-hashtags').value;
    await Api.updatePost(id, { content, hashtags });
    closeEditor();
    await refreshPosts(); // reload dashboard so card shows updated text
}

/**
 * Saves edits - changes post status from 'draft' -> 'approved'
 * called by "Save & Approve" button
 *
 * @param {number} id - post id
 */
async function saveAndApprove(id) {
    const content  = document.getElementById('edit-area').value;
    const hashtags = document.getElementById('edit-hashtags').value;
    await Api.updatePost(id, { content, hashtags, status: 'approved' });
    closeEditor();
    await refreshPosts();
}

/**
 * Saves edits and publishes post through buffer
 * only available when post.status === 'approved'
 *
 * @param {number} id - Post id
 */
async function saveAndPublish(id) {
    const content  = document.getElementById('edit-area').value;
    const hashtags = document.getElementById('edit-hashtags').value;
    // Save any in-progress edits first, then publish
    await Api.updatePost(id, { content, hashtags });
    const result = await Api.publishPost(id);
    if (result.error) {
        alert('Publish failed: ' + result.error);
    }
    closeEditor();
    await refreshPosts();
}

/**
 * Closes the editor menu and clears inner HTML.
 */
function closeEditor() {
    const modal     = document.getElementById('editor-modal');
    const container = document.getElementById('editor-container');
    modal.classList.add('hidden');
    container.innerHTML = ''; // Clears old data
}
