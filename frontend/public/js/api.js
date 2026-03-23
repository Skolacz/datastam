/**
 * api.js
 * Thin wrapper around all backend API endpoints.
 * Every method returns a plain JavaScript object (parsed JSON) or, on network
 * failure, a fallback value so callers don't need to handle exceptions.
 *
 * All endpoints are relative (e.g. /api/posts) so they resolve against whatever host is serving the frontend
 */
const Api = {

    // -- Story capture ------------------------------------------

    /**
     * Sends Datastam story URL to backend, which calls Capture Tool API, extracts sections/charts, saves to database
     *
     * POST /api/stories/capture
     * @param {string} targetUrl - valid datastam.ai story URL
     * @returns {{ success: boolean, story: object, error?: string }}
     */
    async captureStory(targetUrl) {
        try {
            const response = await fetch('/api/stories/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl })
            });
            return await response.json();
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    // -- AI generation ---------------------------------------------

    /**
     * Asks backend to run Claude on all sections of a story
     * save the resulting draft posts to database.
     *
     * POST /api/generate
     * @param {string}   storyId   - The story's integer id (from the DB)
     * @param {string[]} platforms - e.g. ['linkedin', 'twitter', 'instagram']
     * @returns {{ success: boolean, count: number, error?: string }}
     */
    async generatePosts(storyId, platforms) {
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storyId, platforms })
            });
            return await response.json();
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    // -- Story management ---------------------------------

    /**
     * Returns all captured stories (id, title, url, captured_at, etc.)
     * without full sections JSON
     *
     * GET /api/stories
     * @returns {object[]} - Array of story objects. empty array on error
     */
    async getStories() {
        try {
            const response = await fetch('/api/stories');
            return await response.json();
        } catch (e) {
            console.error('getStories error:', e);
            return [];
        }
    },

    /**
     * Returns single story including full sections array (text, insights, chart indices). Used by editor
     *
     * GET /api/stories/:id
     * @param {number} id - Story id
     * @returns {object|null} - Story object, or null on error
     */
    async getStory(id) {
        try {
            const response = await fetch(`/api/stories/${id}`);
            return await response.json();
        } catch (e) {
            console.error('getStory error:', e);
            return null;
        }
    },

    // -- Post management -----------------------------------------

    /**
     * Returns array of posts
     *
     * GET /api/posts?platform=linkedin&status=draft
     * @param {{ platform?: string, status?: string, storyId?: number }} filters
     * @returns {object[]} - Array of post objects. empty array on error
     */
    async getPosts(filters = {}) {
        try {
            const params = new URLSearchParams();
            // Only append filter when not default 'all'
            if (filters.platform && filters.platform !== 'all') params.set('platform', filters.platform);
            if (filters.status   && filters.status   !== 'all') params.set('status',   filters.status);
            if (filters.storyId)                                params.set('storyId',  filters.storyId);

            const response = await fetch(`/api/posts?${params.toString()}`);
            return await response.json();
        } catch (e) {
            console.error('getPosts error:', e);
            return [];
        }
    },

    /**
     * Returns single post by id with all fields.
     *
     * GET /api/posts/:id
     * @param {number} id - Post id
     * @returns {object|null} - Post object or null on error
     */
    async getPost(id) {
        try {
            const response = await fetch(`/api/posts/${id}`);
            return await response.json();
        } catch (e) {
            console.error('getPost error:', e);
            return null;
        }
    },

    /**
     * Updates post's editable fields.
     * Pass only fields user wants to change
     *
     * PUT /api/posts/:id
     * @param {number} id   - Post id
     * @param {{ content?: string, hashtags?: string, status?: string }} data
     * @returns {object} - Updated post, or { error } on failure
     */
    async updatePost(id, data) {
        try {
            const response = await fetch(`/api/posts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (e) {
            console.error('updatePost error:', e);
            return { error: e.message };
        }
    },

    /**
     * Advances a post's status from 'draft' -> 'approved'
     * Separate from updatePost to make approval intent explicit
     *
     * PUT /api/posts/:id/approve
     * @param {number} id - Post id
     * @returns {object} - Updated post, or { error } on failure
     */
    async approvePost(id) {
        try {
            const response = await fetch(`/api/posts/${id}/approve`, { method: 'PUT' });
            return await response.json();
        } catch (e) {
            console.error('approvePost error:', e);
            return { error: e.message };
        }
    },

    /**
     * Publishes approved post to its social platform via buffer
     * backend sends the post to buffer and updates database status to 'posted'
     *
     * PUT /api/posts/:id/publish
     * @param {number} id - Post id (must have status 'approved')
     * @returns {object} - Result with buffer_update_id, or { error } on failure
     */
    async publishPost(id) {
        try {
            const response = await fetch(`/api/posts/${id}/publish`, { method: 'PUT' });
            return await response.json();
        } catch (e) {
            console.error('publishPost error:', e);
            return { error: e.message };
        }
    },

    /**
     * Permanently deletes post from the database
     * dashboard always shows confirm dialog before calling
     *
     * DELETE /api/posts/:id
     * @param {number} id - Post id
     * @returns {object} - { success: true } or { error } on failure
     */
    async deletePost(id) {
        try {
            const response = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
            return await response.json();
        } catch (e) {
            console.error('deletePost error:', e);
            return { error: e.message };
        }
    }
};
