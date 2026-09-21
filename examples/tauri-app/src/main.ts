import {
	enableRegion,
	isSupported,
	isVoiceOverRunning,
	onVoiceOverChanged,
	setWebviewDirectTouch,
	type DirectTouchRegion,
} from 'tauri-plugin-direct-touch-api'

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!
const context = canvas.getContext('2d')!
const supportedLine = document.querySelector<HTMLElement>('#supported')!
const statusLine = document.querySelector<HTMLElement>('#status')!
const regionBox = document.querySelector<HTMLInputElement>('#region')!
const silentBox = document.querySelector<HTMLInputElement>('#silent')!
const activationBox = document.querySelector<HTMLInputElement>('#activation')!
const webviewBox = document.querySelector<HTMLInputElement>('#webview')!
const clearButton = document.querySelector<HTMLButtonElement>('#clear')!

const DOT_RADIUS = 6
let region: DirectTouchRegion | undefined

function options() {
	return { silentOnTouch: silentBox.checked, requiresActivation: activationBox.checked }
}

function showStatus(running: boolean) {
	statusLine.textContent = `VoiceOver running: ${running}`
}

async function applyRegion() {
	await region?.disable()
	region = regionBox.checked ? await enableRegion(canvas, { label: 'Drawing canvas', ...options() }) : undefined
}

async function applySettings() {
	await applyRegion()
	await setWebviewDirectTouch(webviewBox.checked, options())
}

canvas.width = canvas.clientWidth
canvas.height = canvas.clientHeight
canvas.addEventListener('pointermove', (event) => {
	context.beginPath()
	context.arc(event.offsetX, event.offsetY, DOT_RADIUS, 0, Math.PI * 2)
	context.fill()
})
clearButton.addEventListener('click', () => context.clearRect(0, 0, canvas.width, canvas.height))
for (const box of [regionBox, silentBox, activationBox, webviewBox]) {
	box.addEventListener('change', applySettings)
}

supportedLine.textContent = `Direct touch supported: ${await isSupported()}`
showStatus(await isVoiceOverRunning())
await onVoiceOverChanged(showStatus)
