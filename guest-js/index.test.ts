// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { DirectTouchRegion } from './index'

const { invoke, addPluginListener } = vi.hoisted(() => ({
	invoke: vi.fn(),
	addPluginListener: vi.fn(),
}))
vi.mock('@tauri-apps/api/core', () => ({ invoke, addPluginListener }))

class FakeResizeObserver {
	disconnected = false
	constructor(public callback: () => void) {
		observers.push(this)
	}
	observe() {}
	disconnect() {
		this.disconnected = true
	}
}

let frames: FrameRequestCallback[]
let observers: FakeResizeObserver[]
let rect: { x: number; y: number; width: number; height: number }
let regions: DirectTouchRegion[]

function flushFrames() {
	const pending = frames
	frames = []
	pending.forEach((callback) => callback(0))
}

function calls(command: string) {
	return invoke.mock.calls.filter(([name]) => name === `plugin:direct-touch|${command}`)
}

function track(region: DirectTouchRegion) {
	regions.push(region)
	return region
}

function makeElement() {
	const element = document.createElement('div')
	element.getBoundingClientRect = () => rect as DOMRect
	return element
}

async function load(supported: boolean) {
	invoke.mockImplementation(async (command: string) => {
		if (command.endsWith('is_supported')) return supported
		if (command.endsWith('is_voice_over_running')) return { running: true }
	})
	return import('./index')
}

beforeEach(() => {
	vi.resetModules()
	invoke.mockReset()
	addPluginListener.mockReset()
	frames = []
	observers = []
	regions = []
	rect = { x: 10, y: 20, width: 100, height: 50 }
	vi.stubGlobal('ResizeObserver', FakeResizeObserver)
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback))
	vi.stubGlobal('cancelAnimationFrame', () => {
		frames = []
	})
})

afterEach(async () => {
	await Promise.all(regions.map((region) => region.disable()))
})

test('enableRegion sends the first rectangle immediately', async () => {
	const { enableRegion } = await load(true)
	track(await enableRegion(makeElement(), { label: 'Canvas', silentOnTouch: true }))
	expect(calls('set_region')).toEqual([
		[
			'plugin:direct-touch|set_region',
			{ id: 'region-0', x: 10, y: 20, width: 100, height: 50, label: 'Canvas', silentOnTouch: true },
		],
	])
})

test('an unchanged rectangle is not sent again', async () => {
	const { enableRegion } = await load(true)
	track(await enableRegion(makeElement(), { label: 'Canvas' }))
	window.dispatchEvent(new Event('scroll'))
	flushFrames()
	expect(calls('set_region')).toHaveLength(1)
})

test('changes are combined into one call per frame', async () => {
	const { enableRegion } = await load(true)
	track(await enableRegion(makeElement(), { label: 'Canvas' }))
	rect = { x: 10, y: -30, width: 100, height: 50 }
	window.dispatchEvent(new Event('scroll'))
	window.dispatchEvent(new Event('scroll'))
	window.dispatchEvent(new Event('resize'))
	observers[0].callback()
	expect(frames).toHaveLength(1)
	flushFrames()
	expect(calls('set_region')).toHaveLength(2)
	expect(calls('set_region')[1][1]).toMatchObject({ id: 'region-0', y: -30 })
})

test('disable stops updates and removes the region', async () => {
	const { enableRegion } = await load(true)
	const region = await enableRegion(makeElement(), { label: 'Canvas' })
	await region.disable()
	expect(calls('remove_region')).toEqual([['plugin:direct-touch|remove_region', { id: 'region-0' }]])
	expect(observers[0].disconnected).toBe(true)
	rect = { x: 0, y: 0, width: 1, height: 1 }
	window.dispatchEvent(new Event('scroll'))
	window.dispatchEvent(new Event('resize'))
	flushFrames()
	expect(calls('set_region')).toHaveLength(1)
})

test('nothing is sent to native when the platform is not supported', async () => {
	const api = await load(false)
	const region = await api.enableRegion(makeElement(), { label: 'Canvas' })
	await region.disable()
	await api.setWebviewDirectTouch(true)
	const unlisten = await api.onVoiceOverChanged(() => {})
	unlisten()
	expect(await api.isVoiceOverRunning()).toBe(false)
	expect(observers).toHaveLength(0)
	expect(addPluginListener).not.toHaveBeenCalled()
	expect(invoke.mock.calls.every(([name]) => name === 'plugin:direct-touch|is_supported')).toBe(true)
})

test('isSupported asks native one time', async () => {
	const { isSupported } = await load(true)
	expect(await isSupported()).toBe(true)
	expect(await isSupported()).toBe(true)
	expect(calls('is_supported')).toHaveLength(1)
})

test('setWebviewDirectTouch passes the flag and options', async () => {
	const { setWebviewDirectTouch } = await load(true)
	await setWebviewDirectTouch(true, { requiresActivation: true })
	expect(calls('set_webview_direct_touch')).toEqual([
		['plugin:direct-touch|set_webview_direct_touch', { enabled: true, requiresActivation: true }],
	])
})

test('isVoiceOverRunning returns the native value', async () => {
	const { isVoiceOverRunning } = await load(true)
	expect(await isVoiceOverRunning()).toBe(true)
})

test('onVoiceOverChanged passes the running flag and unregisters', async () => {
	const unregister = vi.fn()
	addPluginListener.mockResolvedValue({ unregister })
	const { onVoiceOverChanged } = await load(true)
	const handler = vi.fn()
	const unlisten = await onVoiceOverChanged(handler)
	expect(addPluginListener.mock.calls[0][0]).toBe('direct-touch')
	expect(addPluginListener.mock.calls[0][1]).toBe('voiceOverChanged')
	addPluginListener.mock.calls[0][2]({ running: true })
	expect(handler).toHaveBeenCalledWith(true)
	unlisten()
	expect(unregister).toHaveBeenCalled()
})
