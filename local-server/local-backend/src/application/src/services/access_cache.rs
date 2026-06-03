use std::time::{Duration, Instant};

use dashmap::DashMap;
use local_server_core::entities::access::AccessCheckResult;

pub struct CachedPermission {
    pub result: AccessCheckResult,
    expires_at: Instant,
}

impl CachedPermission {
    pub fn new(result: AccessCheckResult, ttl: Duration) -> Self {
        Self { result, expires_at: Instant::now() + ttl }
    }

    pub fn is_expired(&self) -> bool {
        Instant::now() >= self.expires_at
    }
}

pub struct AccessCache {
    inner: DashMap<(String, String), CachedPermission>,
    ttl: Duration,
}

impl AccessCache {
    pub fn new(ttl: Duration) -> Self {
        Self { inner: DashMap::new(), ttl }
    }

    pub fn get(&self, user_id: &str, resource_id: &str) -> Option<AccessCheckResult> {
        let key = (user_id.to_owned(), resource_id.to_owned());
        let entry = self.inner.get(&key)?;
        if entry.is_expired() {
            drop(entry);
            self.inner.remove(&key);
            return None;
        }
        Some(entry.result.clone())
    }

    pub fn set(&self, user_id: &str, resource_id: &str, result: AccessCheckResult) {
        self.inner.insert(
            (user_id.to_owned(), resource_id.to_owned()),
            CachedPermission::new(result, self.ttl),
        );
    }

    pub fn invalidate_all(&self) {
        self.inner.clear();
    }
}