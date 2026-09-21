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

The example gives feedback that needs no sight. A tone plays while a finger is on the canvas, and the pitch goes up as the finger moves to the right. The "Touches received" line counts each touch. Turn the ring switch to ring mode, because silent mode mutes the tone.

Checklist, with VoiceOver on:

1. Check "Direct touch on canvas". Explore by touch below the "Clear canvas" button. VoiceOver reads "Drawing canvas".
2. Put a finger on the canvas and move it left and right. The tone plays at once, with no double tap, and the pitch follows the finger. "Touches received" goes up by one.
3. Headings, checkboxes, and the button outside the canvas still read normally.
4. Scroll down a short distance with three fingers, then explore by touch. The tone plays only where VoiceOver reads "Drawing canvas". Do the same after you rotate the device.
5. Clear the checkbox. VoiceOver no longer reads "Drawing canvas", and a touch on the canvas plays no tone.
6. Check "Direct touch on whole web view". VoiceOver stops reading page items. A touch on the canvas plays the tone. A direct tap on the same checkbox turns it off, and VoiceOver reads the page again.
7. On iOS 17 or later, with "Silent on touch", VoiceOver says nothing when you touch the canvas. With "Requires activation", the tone plays only after a double tap on the canvas.
8. "VoiceOver running" reads `true`. Turn VoiceOver off and on. The line changes each time.
