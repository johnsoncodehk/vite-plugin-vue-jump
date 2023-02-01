import type { Options } from '@vitejs/plugin-vue';

export function createVuePluginOptions(
	baseOptions: Options = {},
	resolveUrl: (path: string) => string | undefined,
	rootPath = process.cwd()
): Options {

	let compiler = baseOptions.compiler;
	let current: {
		filename: string;
		line: number;
	} | undefined;

	const resolveCache = new Map<string, string | undefined>();

	if (!baseOptions.compiler) {
		const vuePath = require.resolve('vue', { paths: [rootPath] });
		const compilerPath = require.resolve('@vue/compiler-sfc', { paths: [require('path').dirname(vuePath)] });
		compiler = require(compilerPath);
		baseOptions.compiler = { ...compiler! };
	}
	baseOptions.compiler.parse = (...args) => {
		const res = compiler!.parse(...args);
		if (res.descriptor.template && args[1]?.filename?.endsWith('.vue')) {
			current = {
				filename: args[1].filename,
				line: res.descriptor.template.loc.start.line,
			};
		}
		else {
			current = undefined;
		}
		return res;
	};

	baseOptions.template ??= {};
	baseOptions.template.compilerOptions ??= {};
	baseOptions.template.compilerOptions.nodeTransforms ??= [];
	baseOptions.template.compilerOptions.nodeTransforms.push(
		(node) => {
			if (node.type === 1 && current) {
				if (!resolveCache.has(current.filename)) {
					resolveCache.set(current.filename, resolveUrl(current.filename))
				}
				const url = resolveCache.get(current.filename);
				if (url) {
					const start = node.loc.start.line + current.line - 1;
					const end = node.loc.end.line + current.line - 1;
					addEvent(node, 'pointerenter', `$event && $__jumpToCode ? $__jumpToCode.highlight($event.target, ${JSON.stringify(url)}, [${start},${end}]) : undefined`);
					addEvent(node, 'pointerleave', '$event && $__jumpToCode ? $__jumpToCode.unHighlight($event.target) : undefined');
				}
			}
		},
	);

	return baseOptions;

	function addEvent(node: any, name: string, exp: string) {
		node.props.push({
			type: 7,
			name: 'on',
			exp: {
				type: 4,
				content: exp,
				isStatic: false,
				constType: 0,
				loc: node.loc,
			},
			arg: {
				type: 4,
				content: name,
				isStatic: true,
				constType: 3,
				loc: node.loc,
			},
			modifiers: [],
			loc: node.loc,
		});
	}
}

export function searchPackageJson(filePath: string) {

	const path = require('path');

	let dir = path.dirname(filePath);

	while (true) {
		try {
			const pkg = require(require.resolve('./package.json', { paths: [dir] }));
			if (pkg) {
				return {
					packageJson: pkg,
					fileRelativePath: path.relative(dir, filePath),
				};
			}
		} catch { }
		const next = path.dirname(dir);
		if (!next || next === dir) {
			break;
		}
		dir = next;
	}
}
