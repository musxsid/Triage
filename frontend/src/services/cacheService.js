// High-Performance Instant Cache & Offline Storage Manager

const STORAGE_PREFIX = "simplynotes_cache_";

export const CacheService = {
  // Retrieve cached notes instantly (0ms latency)
  getCachedNotes(workspaceId) {
    try {
      const key = `${STORAGE_PREFIX}notes_${workspaceId || "default"}`;
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.warn("Error reading notes cache:", e);
      return null;
    }
  },

  // Save notes to persistent cache
  setCachedNotes(workspaceId, notes) {
    try {
      const key = `${STORAGE_PREFIX}notes_${workspaceId || "default"}`;
      localStorage.setItem(key, JSON.stringify(notes));
    } catch (e) {
      console.warn("Error saving notes cache:", e);
    }
  },

  // Retrieve cached workspaces instantly
  getCachedWorkspaces() {
    try {
      const cached = localStorage.getItem(`${STORAGE_PREFIX}workspaces`);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  },

  // Save workspaces to persistent cache
  setCachedWorkspaces(workspaces) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}workspaces`, JSON.stringify(workspaces));
    } catch (e) {
      console.warn("Error saving workspaces cache:", e);
    }
  },

  // Retrieve cached folders instantly
  getCachedFolders(workspaceId) {
    try {
      const key = `${STORAGE_PREFIX}folders_${workspaceId || "default"}`;
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  },

  // Save folders to persistent cache
  setCachedFolders(workspaceId, folders) {
    try {
      const key = `${STORAGE_PREFIX}folders_${workspaceId || "default"}`;
      localStorage.setItem(key, JSON.stringify(folders));
    } catch (e) {
      console.warn("Error saving folders cache:", e);
    }
  },

  // ================= EMAILS & MULTI-ACCOUNT CACHE =================

  getCachedEmails(email, folder) {
    try {
      const key = `${STORAGE_PREFIX}emails_${email || "default"}_${folder || "inbox"}`;
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  },

  setCachedEmails(email, folder, emails) {
    try {
      const key = `${STORAGE_PREFIX}emails_${email || "default"}_${folder || "inbox"}`;
      localStorage.setItem(key, JSON.stringify(emails));
    } catch (e) {
      console.warn("Error saving emails cache:", e);
    }
  },

  getLinkedEmailAccounts() {
    try {
      const cached = localStorage.getItem(`${STORAGE_PREFIX}linked_accounts`);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  },

  saveLinkedEmailAccounts(accounts) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}linked_accounts`, JSON.stringify(accounts));
    } catch (e) {
      console.warn("Error saving linked accounts:", e);
    }
  },

  // Clear cache on logout
  clearCache() {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("Error clearing cache:", e);
    }
  }
};
