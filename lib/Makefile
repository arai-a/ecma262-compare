gunzip.wasm: src/lib.rs Cargo.toml
	wasm-pack build --release --target web
	wasm-snip \
		--snip-rust-panicking-code \
		--snip-rust-fmt-code \
		-o ../js/gunzip.wasm \
		pkg/wasm_gunzip_bg.wasm
