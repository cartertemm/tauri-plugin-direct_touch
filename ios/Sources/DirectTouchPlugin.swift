import SwiftRs
import Tauri
import UIKit
import WebKit

struct WebviewArgs: Decodable {
	let enabled: Bool
	let silentOnTouch: Bool?
	let requiresActivation: Bool?
}

struct RegionArgs: Decodable {
	let id: String
	let x: Double
	let y: Double
	let width: Double
	let height: Double
	let label: String
	let silentOnTouch: Bool?
	let requiresActivation: Bool?
}

struct RemoveRegionArgs: Decodable {
	let id: String
}

class RegionOverlayView: UIView {
	override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
		return nil
	}
}

func setDirectTouch(_ view: UIView, enabled: Bool, silentOnTouch: Bool?, requiresActivation: Bool?) {
	view.isAccessibilityElement = enabled
	if enabled {
		view.accessibilityTraits.insert(.allowsDirectInteraction)
	} else {
		view.accessibilityTraits.remove(.allowsDirectInteraction)
	}
	if #available(iOS 17.0, *) {
		var options: UIAccessibility.DirectTouchOptions = []
		if enabled && silentOnTouch == true {
			options.insert(.silentOnTouch)
		}
		if enabled && requiresActivation == true {
			options.insert(.requiresActivation)
		}
		view.accessibilityDirectTouchOptions = options
	}
}

class DirectTouchPlugin: Plugin {
	private var webview: WKWebView!
	private var regions: [String: RegionOverlayView] = [:]

	public override func load(webview: WKWebView) {
		self.webview = webview
		NotificationCenter.default.addObserver(
			self,
			selector: #selector(voiceOverStatusChanged),
			name: UIAccessibility.voiceOverStatusDidChangeNotification,
			object: nil)
	}

	@objc private func voiceOverStatusChanged() {
		trigger("voiceOverChanged", data: ["running": UIAccessibility.isVoiceOverRunning])
	}

	@objc public func setWebviewDirectTouch(_ invoke: Invoke) throws {
		let args = try invoke.parseArgs(WebviewArgs.self)
		DispatchQueue.main.async {
			setDirectTouch(
				self.webview,
				enabled: args.enabled,
				silentOnTouch: args.silentOnTouch,
				requiresActivation: args.requiresActivation)
			UIAccessibility.post(notification: .layoutChanged, argument: nil)
			invoke.resolve()
		}
	}

	@objc public func setRegion(_ invoke: Invoke) throws {
		let args = try invoke.parseArgs(RegionArgs.self)
		DispatchQueue.main.async {
			var overlay = self.regions[args.id]
			if overlay == nil {
				overlay = RegionOverlayView()
				overlay!.backgroundColor = .clear
				self.webview.addSubview(overlay!)
				self.regions[args.id] = overlay
				UIAccessibility.post(notification: .layoutChanged, argument: nil)
			}
			overlay!.frame = CGRect(x: args.x, y: args.y, width: args.width, height: args.height)
			overlay!.isHidden = args.width == 0 || args.height == 0
			overlay!.accessibilityLabel = args.label
			setDirectTouch(
				overlay!,
				enabled: true,
				silentOnTouch: args.silentOnTouch,
				requiresActivation: args.requiresActivation)
			invoke.resolve()
		}
	}

	@objc public func removeRegion(_ invoke: Invoke) throws {
		let args = try invoke.parseArgs(RemoveRegionArgs.self)
		DispatchQueue.main.async {
			self.regions.removeValue(forKey: args.id)?.removeFromSuperview()
			UIAccessibility.post(notification: .layoutChanged, argument: nil)
			invoke.resolve()
		}
	}

	@objc public func isVoiceOverRunning(_ invoke: Invoke) {
		invoke.resolve(["running": UIAccessibility.isVoiceOverRunning])
	}
}

@_cdecl("init_plugin_direct_touch")
func initPlugin() -> Plugin {
	return DirectTouchPlugin()
}
