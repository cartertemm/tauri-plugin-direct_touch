use tauri::{
	plugin::{Builder, TauriPlugin},
	Runtime,
};

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_direct_touch);

#[tauri::command]
fn is_supported() -> bool {
	cfg!(target_os = "ios")
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
	Builder::new("direct-touch")
		.invoke_handler(tauri::generate_handler![is_supported])
		.setup(|_app, _api| {
			#[cfg(target_os = "ios")]
			_api.register_ios_plugin(init_plugin_direct_touch)?;
			Ok(())
		})
		.build()
}
