//! Versioned persistence contract; platform adapters provide durable storage.
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
pub fn namespaced_key(user_id: &str, feature: &str, item: &str) -> String {
    format!("principia:v{}:{}:{}:{}", CURRENT_SCHEMA_VERSION, user_id, feature, item)
}
