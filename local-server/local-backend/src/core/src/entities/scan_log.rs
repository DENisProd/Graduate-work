use std::{collections::VecDeque, sync::{Arc, Mutex}};
use chrono::{DateTime, Utc};
use serde::Serialize;

pub const SCAN_LOG_CAPACITY: usize = 50;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanLogDevice {
    pub slave_id: i64,
    pub baud_rate: u64,
    pub coils: u16,
    pub discrete_inputs: u16,
    pub holding_registers: u16,
    pub input_registers: u16,
    pub is_new: bool,
    pub name: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanLogEntry {
    pub timestamp: DateTime<Utc>,
    pub found: usize,
    pub registered: usize,
    pub devices: Vec<ScanLogDevice>,
}

pub type ScanLog = Arc<Mutex<VecDeque<ScanLogEntry>>>;

pub fn new_scan_log() -> ScanLog {
    Arc::new(Mutex::new(VecDeque::with_capacity(SCAN_LOG_CAPACITY)))
}
