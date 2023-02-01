import type { App } from 'vue';

export default function install(app: App, options?: {
	overlayStyle?: CSSStyleDeclaration,
	hotKey?: string,
}) {

	if (!globalThis.window)
		return;

	const hotKey = options?.hotKey ?? 'Alt';

	window.addEventListener('scroll', updateOverlay);
	window.addEventListener('pointerdown', event => {
		disable(true);
	});
	window.addEventListener('keydown', event => {
		if (event.key === hotKey) {
			enable();
		}
	});
	window.addEventListener('keyup', event => {
		if (event.key === hotKey) {
			disable(false);
		}
	});

	const overlay = createOverlay();
	const clickMask = createClickMask();

	let highlightNodes: [Element, string, [number, number]][] = [];
	let enabled = false;
	let jumpData: {
		url: string;
		range: [number, number];
	} | undefined;

	app.config.globalProperties.$__jumpToCode = {
		highlight,
		unHighlight,
	};

	function enable() {
		enabled = true;
		clickMask.style.pointerEvents = 'none';
		document.body.appendChild(clickMask);
		updateOverlay();
	}
	function disable(jump: boolean) {
		if (enabled) {
			enabled = false;
			clickMask.style.pointerEvents = '';
			highlightNodes = [];
			updateOverlay();
			if (jumpData) {
				if (jump) {
					const line = jumpData.range[0] === jumpData.range[1] ? `#L${jumpData.range[0]}` : `#L${jumpData.range[0]}-L${jumpData.range[1]}`;
					window.open(jumpData.url + line, '_blank');
				}
				jumpData = undefined;
			}
		}
	}
	function highlight(node: unknown, fileName: string, range: [number, number]) {
		if (node instanceof Element) {
			highlightNodes.push([node, fileName, range]);
		}
		updateOverlay();
	}
	function unHighlight(node: Element) {
		highlightNodes = highlightNodes.filter(hNode => hNode[0] !== node);
		updateOverlay();
	}
	function createOverlay() {
		const overlay = document.createElement('div');
		if (options?.overlayStyle) {
			Object.assign(overlay.style, options.overlayStyle);
		}
		else {
			overlay.style.backgroundColor = 'rgba(65, 184, 131, 0.35)';
			overlay.style.borderRadius = '3px';
		}
		overlay.style.position = 'fixed';
		overlay.style.zIndex = '99999999999999';
		overlay.style.pointerEvents = 'none';
		overlay.style.display = 'flex';
		overlay.style.alignItems = 'center';
		overlay.style.justifyContent = 'center';
		return overlay;
	}
	function createClickMask() {
		const overlay = document.createElement('div');
		overlay.style.position = 'fixed';
		overlay.style.zIndex = '99999999999999';
		overlay.style.pointerEvents = 'none';
		overlay.style.display = 'flex';
		overlay.style.left = '0';
		overlay.style.right = '0';
		overlay.style.top = '0';
		overlay.style.bottom = '0';
		overlay.addEventListener('pointerup', () => {
			if (overlay.parentNode) {
				overlay.parentNode?.removeChild(overlay);
			}
		});
		return overlay;
	}
	function updateOverlay() {
		if (enabled && highlightNodes.length) {
			document.body.appendChild(overlay);
			const highlight = highlightNodes[highlightNodes.length - 1];
			const highlightNode = highlight[0];
			const rect = highlightNode.getBoundingClientRect();
			overlay.style.width = ~~rect.width + 'px';
			overlay.style.height = ~~rect.height + 'px';
			overlay.style.top = ~~rect.top + 'px';
			overlay.style.left = ~~rect.left + 'px';
			jumpData = {
				url: highlight[1],
				range: highlight[2],
			};
		}
		else if (overlay.parentNode) {
			overlay.parentNode.removeChild(overlay);
		}
	}
}
