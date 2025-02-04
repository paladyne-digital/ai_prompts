// User-specific cache with expiration and size management
class TaskCache {
    constructor(options = {}) {
      this.cache = new Map()
      this.CACHE_EXPIRATION_MS = options.expirationMs || 24 * 60 * 60 * 1000 // 24 hours default
      this.MAX_CACHE_SIZE = options.maxSize || 100 // Default max 100 entries
      this.runningTask = null
    }
  
    async #runTask(task) {
      const previousTask = this.runningTask
      const currentTask = task()
      try {
        if (previousTask) {
          await previousTask
        }
        this.runningTask = currentTask
        return await this.runningTask
      } catch (error) {
        console.error('Cache operation failed:', error)
        throw error
      } finally {
        if (this.runningTask === currentTask) {
          this.runningTask = null
        }
      }
    }
  
    // Update cached data
    async update(key, data) {
      return this.set(key, data) // Reuse the set method for updating
    }
    
    // Cached entry with timestamp
    #CachedEntry = class {
      constructor(data) {
        this.data = data
        this.timestamp = Date.now()
      }
  
      isExpired(expirationMs) {
        return (Date.now() - this.timestamp) > expirationMs
      }
    }
  
    // Get cached data
    async get(key) {
      return this.#runTask(async () => {
        const cachedEntry = this.cache.get(key)
        if (!cachedEntry || cachedEntry.isExpired(this.CACHE_EXPIRATION_MS)) {
          console.log(`Cache miss or expired for key: ${key}`)
          return null
        }
        // console.log(`Cache hit for key: ${key}`, cachedEntry.data)
        return cachedEntry.data
      })
    }
  
    // Set cached data
    async set(key, data) {
      // console.log(`Cache set for key: ${key}`)
      return this.#runTask(async () => {
        // Manage cache size
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
          const oldestKey = Array.from(this.cache.keys())[0]
          this.cache.delete(oldestKey)
        }
        // console.log(`In run task... Cache set for key: ${key}`)
        const entry = new this.#CachedEntry(data)
        this.cache.set(key, entry)
        // console.log(`Cache set for key: ${key}`, data)
        console.log(`Cache set (data added) for key: ${key}`)
        return data
      })
    }
  
    // Clear specific cache entry
    async clear(key) {
      return this.#runTask(async () => {
        this.cache.delete(key)
      })
    }
  
    // Clear entire cache
    async clearAll() {
      return this.#runTask(async () => {
        this.cache.clear()
      })
    }
  
    // Check if cache has non-expired entry
    async has(key) {
      const cachedEntry = this.cache.get(key)
      return cachedEntry && !cachedEntry.isExpired(this.CACHE_EXPIRATION_MS)
    }
  }
  
  export default TaskCache
  