/**
 * @order 11.5
 * @category Data
 * @description IndexedDB image storage for task images
 *
 * Provides binary image storage separate from localStorage
 * Uses IndexedDB for ~50MB+ capacity (hundreds of images)
 *
 * KEY FUNCTIONS:
 * - initImageStore() - Initialize IndexedDB database
 * - saveImage(blob, id) - Store image blob with optional custom ID
 * - getImage(id) - Retrieve image blob by ID
 * - deleteImage(id) - Delete image from store
 * - getAllImages() - Get all stored images (for export)
 * - clearAllImages() - Delete all images (for import/reset)
 */

export const ImageStoreMixin = {
    imageStore: null,  // IndexedDB database reference
    imageCache: new Map(),  // In-memory cache for loaded images (blob URLs)

    /**
     * Initialize IndexedDB for image storage
     * Called on app startup
     */
    async initImageStore() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('TaskTreeImages', 1);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                this.showToast('⚠️ Image storage unavailable', 'warning', 3000);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.imageStore = request.result;
                console.log('[image-store.js] IndexedDB initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object store for images
                if (!db.objectStoreNames.contains('images')) {
                    const objectStore = db.createObjectStore('images', { keyPath: 'id' });
                    objectStore.createIndex('taskId', 'taskId', { unique: false });
                    console.log('[image-store.js] Created images object store');
                }
            };
        });
    },

    /**
     * Save image to IndexedDB
     * @param {Blob} blob - Image blob data
     * @param {string} id - Optional custom ID (defaults to generated ID)
     * @returns {Promise<string>} - Image ID
     */
    async saveImage(blob, id = null) {
        if (!this.imageStore) {
            await this.initImageStore();
        }

        // Generate ID if not provided
        const imageId = id || `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return new Promise((resolve, reject) => {
            const transaction = this.imageStore.transaction(['images'], 'readwrite');
            const objectStore = transaction.objectStore('images');

            const imageData = {
                id: imageId,
                blob: blob,
                type: blob.type,
                size: blob.size,
                timestamp: Date.now()
            };

            const request = objectStore.put(imageData);

            request.onsuccess = () => {
                console.log(`[image-store.js] Saved image: ${imageId} (${Math.round(blob.size / 1024)}KB)`);
                resolve(imageId);
            };

            request.onerror = () => {
                console.error('Failed to save image:', request.error);
                reject(request.error);
            };
        });
    },

    /**
     * Get image from IndexedDB
     * @param {string} id - Image ID
     * @returns {Promise<Blob|null>} - Image blob or null if not found
     */
    async getImage(id) {
        if (!this.imageStore) {
            await this.initImageStore();
        }

        // Check cache first
        if (this.imageCache.has(id)) {
            const cachedUrl = this.imageCache.get(id);
            // Verify blob URL is still valid
            try {
                await fetch(cachedUrl);
                return cachedUrl;
            } catch {
                // Blob URL expired, remove from cache
                this.imageCache.delete(id);
            }
        }

        return new Promise((resolve, reject) => {
            const transaction = this.imageStore.transaction(['images'], 'readonly');
            const objectStore = transaction.objectStore('images');
            const request = objectStore.get(id);

            request.onsuccess = () => {
                if (request.result) {
                    const blob = request.result.blob;
                    // Create blob URL and cache it
                    const blobUrl = URL.createObjectURL(blob);
                    this.imageCache.set(id, blobUrl);
                    resolve(blobUrl);
                } else {
                    console.warn(`[image-store.js] Image not found: ${id}`);
                    resolve(null);
                }
            };

            request.onerror = () => {
                console.error('Failed to get image:', request.error);
                reject(request.error);
            };
        });
    },

    /**
     * Delete image from IndexedDB
     * @param {string} id - Image ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteImage(id) {
        if (!this.imageStore) {
            await this.initImageStore();
        }

        // Remove from cache
        if (this.imageCache.has(id)) {
            const blobUrl = this.imageCache.get(id);
            URL.revokeObjectURL(blobUrl);
            this.imageCache.delete(id);
        }

        return new Promise((resolve, reject) => {
            const transaction = this.imageStore.transaction(['images'], 'readwrite');
            const objectStore = transaction.objectStore('images');
            const request = objectStore.delete(id);

            request.onsuccess = () => {
                console.log(`[image-store.js] Deleted image: ${id}`);
                resolve(true);
            };

            request.onerror = () => {
                console.error('Failed to delete image:', request.error);
                reject(request.error);
            };
        });
    },

    /**
     * Get all images (for export)
     * @returns {Promise<Array>} - Array of {id, blob, type, size}
     */
    async getAllImages() {
        if (!this.imageStore) {
            await this.initImageStore();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.imageStore.transaction(['images'], 'readonly');
            const objectStore = transaction.objectStore('images');
            const request = objectStore.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Failed to get all images:', request.error);
                reject(request.error);
            };
        });
    },

    /**
     * Clear all images (for import/reset)
     * @returns {Promise<boolean>} - Success status
     */
    async clearAllImages() {
        if (!this.imageStore) {
            await this.initImageStore();
        }

        // Clear cache
        this.imageCache.forEach(blobUrl => URL.revokeObjectURL(blobUrl));
        this.imageCache.clear();

        return new Promise((resolve, reject) => {
            const transaction = this.imageStore.transaction(['images'], 'readwrite');
            const objectStore = transaction.objectStore('images');
            const request = objectStore.clear();

            request.onsuccess = () => {
                console.log('[image-store.js] Cleared all images');
                resolve(true);
            };

            request.onerror = () => {
                console.error('Failed to clear images:', request.error);
                reject(request.error);
            };
        });
    },

    /**
     * Get storage usage stats
     * @returns {Promise<{count: number, totalSize: number}>}
     */
    async getImageStats() {
        const images = await this.getAllImages();
        const totalSize = images.reduce((sum, img) => sum + img.size, 0);
        return {
            count: images.length,
            totalSize: totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
        };
    }
};

console.log('[image-store.js] Image storage module loaded');
