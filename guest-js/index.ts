import { addPluginListener, invoke } from '@tauri-apps/api/core'

export interface DirectTouchOptions {
	silentOnTouch?: boolean
	requiresActivation?: boolean
}

export interface RegionOptions extends DirectTouchOptions {
	label: string
}

export interface DirectTouchRegion {
	disable(): Promise<void>
}

const PLUGIN = 'direct-touch'
const VOICE_OVER_CHANGED = 'voiceOverChanged'

let supported: Promise<boolean> | undefined
let nextRegionId = 0

function command(name: string) {
	return `plugin:${PLUGIN}|${name}`
}

export function isSupported(): Promise<boolean> {
	supported ??= invoke<boolean>(command('is_supported'))
	return supported
}

export async function setWebviewDirectTouch(enabled: boolean, options: DirectTouchOptions = {}): Promise<void> {
	if (!(await isSupported())) return
	await invoke(command('set_webview_direct_touch'), { enabled, ...options })
}

export async function enableRegion(element: Element, options: RegionOptions): Promise<DirectTouchRegion> {
	if (!(await isSupported())) return { disable: async () => {} }
	const id = `region-${nextRegionId++}`
	let lastRect = ''
	let frame = 0
	const send = () => {
		frame = 0
		const { x, y, width, height } = element.getBoundingClientRect()
		const rect = [x, y, width, height].join()
		if (rect === lastRect) return
		lastRect = rect
		void invoke(command('set_region'), { id, x, y, width, height, ...options })
	}
	const schedule = () => {
		frame ||= requestAnimationFrame(send)
	}
	const observer = new ResizeObserver(schedule)
	observer.observe(element)
	window.addEventListener('scroll', schedule, true)
	window.addEventListener('resize', schedule)
	send()
	return {
		async disable() {
			observer.disconnect()
			window.removeEventListener('scroll', schedule, true)
			window.removeEventListener('resize', schedule)
			cancelAnimationFrame(frame)
			await invoke(command('remove_region'), { id })
		},
	}
}

export async function isVoiceOverRunning(): Promise<boolean> {
	if (!(await isSupported())) return false
	const { running } = await invoke<{ running: boolean }>(command('is_voice_over_running'))
	return running
}

export async function onVoiceOverChanged(handler: (running: boolean) => void): Promise<() => void> {
	if (!(await isSupported())) return () => {}
	const listener = await addPluginListener<{ running: boolean }>(PLUGIN, VOICE_OVER_CHANGED, (event) =>
		handler(event.running),
	)
	return () => void listener.unregister()
}
