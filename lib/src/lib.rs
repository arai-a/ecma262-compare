use libflate::gzip::Decoder;
use std::io::Read;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn decompress(data: &[u8]) -> Vec<u8> {
    if let Ok(mut decoder) = Decoder::new(data) {
        let mut result = Vec::new();
        if let Ok(_) = decoder.read_to_end(&mut result) {
            return result
        }
    }
    Vec::new()
}
