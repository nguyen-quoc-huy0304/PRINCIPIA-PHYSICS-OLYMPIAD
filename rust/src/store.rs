//! Versioned persistence contract and deterministic in-memory adapter for tests.
use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Record {
    pub key: String,
    pub schema_version: u32,
    pub payload: Vec<u8>,
}

pub trait Store {
    type Error;
    fn get(&self, key: &str) -> Result<Option<Record>, Self::Error>;
    fn put(&mut self, record: Record) -> Result<(), Self::Error>;
    fn delete(&mut self, key: &str) -> Result<(), Self::Error>;
}

pub const CURRENT_SCHEMA_VERSION: u32 = 1;

/// Stable key layout keeps each user's data isolated by feature and item.
pub fn namespaced_key(user_id: &str, feature: &str, item: &str) -> String {
    format!("principia:v{}:{}:{}:{}", CURRENT_SCHEMA_VERSION, user_id, feature, item)
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MemoryStoreError {
    EmptyKey,
    UnsupportedSchema { received: u32, supported: u32 },
}

/// In-memory implementation used by tests and previews. Production clients
/// must provide a durable adapter and must not treat this as cloud sync.
#[derive(Debug, Default, Clone)]
pub struct MemoryStore {
    records: HashMap<String, Record>,
}

impl MemoryStore {
    pub fn with_capacity(capacity: usize) -> Self { Self { records: HashMap::with_capacity(capacity) } }
    pub fn len(&self) -> usize { self.records.len() }
    pub fn is_empty(&self) -> bool { self.records.is_empty() }
}

impl Store for MemoryStore {
    type Error = MemoryStoreError;

    fn get(&self, key: &str) -> Result<Option<Record>, Self::Error> {
        if key.trim().is_empty() { return Err(MemoryStoreError::EmptyKey); }
        Ok(self.records.get(key).cloned())
    }

    fn put(&mut self, record: Record) -> Result<(), Self::Error> {
        if record.key.trim().is_empty() { return Err(MemoryStoreError::EmptyKey); }
        if record.schema_version != CURRENT_SCHEMA_VERSION {
            return Err(MemoryStoreError::UnsupportedSchema {
                received: record.schema_version,
                supported: CURRENT_SCHEMA_VERSION,
            });
        }
        self.records.insert(record.key.clone(), record);
        Ok(())
    }

    fn delete(&mut self, key: &str) -> Result<(), Self::Error> {
        if key.trim().is_empty() { return Err(MemoryStoreError::EmptyKey); }
        self.records.remove(key);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trip_and_delete() {
        let mut store = MemoryStore::default();
        let record = Record { key: namespaced_key("u1", "notes", "l1"), schema_version: CURRENT_SCHEMA_VERSION, payload: b"hello".to_vec() };
        store.put(record.clone()).unwrap();
        assert_eq!(store.get(&record.key).unwrap(), Some(record.clone()));
        store.delete(&record.key).unwrap();
        assert_eq!(store.get(&record.key).unwrap(), None);
    }

    #[test]
    fn rejects_empty_keys_and_unknown_schema() {
        let mut store = MemoryStore::default();
        assert_eq!(store.get(" ").unwrap_err(), MemoryStoreError::EmptyKey);
        let err = store.put(Record { key: "x".into(), schema_version: 99, payload: vec![] }).unwrap_err();
        assert_eq!(err, MemoryStoreError::UnsupportedSchema { received: 99, supported: CURRENT_SCHEMA_VERSION });
    }

    #[test]
    fn user_data_is_namespaced() {
        assert_ne!(namespaced_key("user-a", "notes", "1"), namespaced_key("user-b", "notes", "1"));
    }
}
