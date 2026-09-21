# tauri-plugin-direct-touch

A Tauri v2 plugin that turns on the iOS direct touch accessibility trait. With direct touch, VoiceOver passes touches straight to your app. Use it for controls that need raw touch input, such as a drawing area, a game surface, or an instrument.

On Android and desktop, all calls succeed and do nothing.

## Install

`src-tauri/Cargo.toml`:

```toml
[dependencies]
tauri-plugin-direct-touch = { git = "https://github.com/cartertemm/tauri-plugin-direct-touch" }
```

`src-tauri/src/lib.rs`:

```rust
tauri::Builder::default()
	.plugin(tauri_plugin_direct_touch::init())
```

`src-tauri/capabilities/default.json`: add `"direct-touch:default"` to `permissions`.

JavaScript:

```bash
npm install github:cartertemm/tauri-plugin-direct-touch
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

Known limit: a region updates on scroll, window resize, and element resize. If the element moves for a different reason (for example, content above it changes height), the region updates on the next scroll or resize.

## Test on a device

The iOS Simulator has no VoiceOver. Use a real device.

```bash
npm install
npm run build
cd examples/tauri-app
npm install
npx tauri ios init
npx tauri ios dev
```

Checklist, with VoiceOver on:

1. Check "Direct touch on canvas". Focus lands on the canvas and VoiceOver reads "Drawing canvas".
2. Touches on the canvas draw dots.
3. Content outside the canvas still reads normally.
4. The region follows the canvas on scroll and on rotation.
5. Clear the checkbox. The region is gone.
6. "Direct touch on whole web view" works in both directions.
7. "Silent on touch" and "Requires activation" work on iOS 17 or later.
8. The status line changes when VoiceOver is turned on and off.
