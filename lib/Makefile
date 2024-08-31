# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

gunzip.wasm: src/lib.rs Cargo.toml
	wasm-pack build --release --target web
	wasm-snip \
		--snip-rust-panicking-code \
		--snip-rust-fmt-code \
		-o ../js/gunzip.wasm \
		pkg/wasm_gunzip_bg.wasm
