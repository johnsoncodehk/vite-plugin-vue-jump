# vite-plugin-vue-jump

This plugin creates for support jump to source code of the specific element from your web page.

⚠️ Since this plugin will add `pointerenter` and `pointerleave` events for all elements, you should not use this plugin in production, but just for debugging.

Try it: https://volarjs.github.io/

## Install

main.ts:

```ts
import jumpPlugin from 'vite-plugin-vue-jump/client';

// ...

app.use(jumpPlugin);
```

Vite config:

```ts
import { createVuePluginOptions, searchPackageJson } from 'vite-plugin-vue-jump';

export default {
	vue: createVuePluginOptions(
		// base config
		{ reactivityTransform: true },
		// resolve url for dependencies
		(filePath) => {
			const info = searchPackageJson(filePath);
			if (info.packageJson.name === '@vue/theme') {
				return 'https://github.com/vuejs/theme/tree/main/' + info.fileRelativePath;
			}
			else if (info.packageJson.name === '@volar/docs') {
				return 'https://github.com/volarjs/volarjs.github.io/blob/master/' + info.fileRelativePath;
			}
		},
	)
};
```

## Usage

Hover any element on your page and press `Alt` + left click to jump.

## Sponsors

<p align="center">
	<a href="https://cdn.jsdelivr.net/gh/johnsoncodehk/sponsors/sponsors.svg">
		<img src="https://cdn.jsdelivr.net/gh/johnsoncodehk/sponsors/sponsors.svg"/>
	</a>
</p>
