const Api = {

    // POST /api/stories/capture - Send Datastam URL
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

    // POST /api/generate - Generate AI posts
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

    // GET /api/stories - List captured stories
    async getStories() {
        try {
            const response = await fetch('/api/stories');
            return await response.json();
        } catch (e) {
            console.error('getStories error:', e);
            return [];
        }
    },

    // GET /api/stories/:id - Get story with full sections
    async getStory(id) {
        try {
            const response = await fetch(`/api/stories/${id}`);
            return await response.json();
        } catch (e) {
            console.error('getStory error:', e);
            return null;
        }
    },

    // GET /api/posts - List posts
    async getPosts(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.platform && filters.platform !== 'all') params.set('platform', filters.platform);
            if (filters.status && filters.status !== 'all') params.set('status', filters.status);
            if (filters.storyId) params.set('storyId', filters.storyId);

            const response = await fetch(`/api/posts?${params.toString()}`);
            return await response.json();
        } catch (e) {
            console.error('getPosts error:', e);
            return [];
        }
    },

    // GET /api/posts/:id - Get single post
    async getPost(id) {
        try {
            const response = await fetch(`/api/posts/${id}`);
            return await response.json();
        } catch (e) {
            console.error('getPost error:', e);
            return null;
        }
    },

    // PUT /api/posts/:id - Update post's content, hashtags, status
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

    // PUT /api/posts/:id/approve - Approve a draft
    async approvePost(id) {
        try {
            const response = await fetch(`/api/posts/${id}/approve`, { method: 'PUT' });
            return await response.json();
        } catch (e) {
            console.error('approvePost error:', e);
            return { error: e.message };
        }
    },

    // DELETE /api/posts/:id - Delete
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
