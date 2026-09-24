# tauri-plugin-direct-touch

A Tauri v2 plugin that makes it possible to use direct touch regions. With direct touch, VoiceOver passes touch gestures straight through to your app.

This is best used when you need raw input such as a game surface, a drawing area, an instrument, etc.

This plugin is safe to include in your app on all platforms, though unless the app is running under iOS, all calls succeed and do nothing.

## Install

`src-tauri/Cargo.toml`:

```toml
[dependencies]
tauri-plugin-direct-touch = "0.1"
```

`src-tauri/src/lib.rs`:

```rust
tauri::Builder::default()
	.plugin(tauri_plugin_direct_touch::init())
```

`src-tauri/capabilities/default.json`: add `"direct-touch:default"` to `permissions`.

JavaScript:

```bash
npm install tauri-plugin-direct-touch-api
```

## Use

```ts
import { enableRegion, setWebviewDirectTouch, isSupported, isVoiceOverRunning, onVoiceOverChanged } from 'tauri-plugin-direct-touch-api'

const region = await enableRegion(document.querySelector('canvas')!, {
	label: 'Drawing canvas',
	silentOnTouch: false,
	requiresActivation: false,
})

await region.disable()

await setWebviewDirectTouch(true)
```

- `enableRegion(element, options)`: direct touch for the area of one element. The region follows the element on scroll and resize. Call `disable()` before you remove the element from the page.
- `setWebviewDirectTouch(enabled, options?)`: direct touch for the whole web view. VoiceOver cannot read the page while this is on.
- `silentOnTouch`, `requiresActivation`: iOS 17 and later. Ignored on older versions.
- `isSupported()`: `true` on iOS.
- `isVoiceOverRunning()`, `onVoiceOverChanged(handler)`: VoiceOver status.

One limitation to be aware of. A region updates on scroll, window resize, and element resize. If the element moves for a different reason (for example, content above it changes height), the region will update on the next scroll or resize. I have not personally run into this yet, but it could present very brief unexpected behavior.

## Test on a device

To run the sample app and test on a physical device:

```bash
npm install
npm run build
cd examples/tauri-app
npm install
npx tauri ios init
npx tauri ios dev
```
