const COMMANDS: &[&str] = &[
	"is_supported",
	"set_webview_direct_touch",
	"set_region",
	"remove_region",
	"is_voice_over_running",
	"register_listener",
	"remove_listener",
];

fn main() {
	tauri_plugin::Builder::new(COMMANDS).ios_path("ios").build();
}
