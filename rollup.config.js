import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const external = ['react', 'react/jsx-runtime', 'vue']

const plugins = [
	resolve(),
	commonjs(),
	typescript({
		tsconfig: './tsconfig.json',
		declaration: true,
		declarationDir: './dist/types',
		exclude: ['**/__tests__/**'],
	}),
]

export default [
	// Main bundle
	{
		input: 'src/index.ts',
		output: [
			{
				file: 'dist/index.js',
				format: 'cjs',
				sourcemap: true,
			},
			{
				file: 'dist/index.esm.js',
				format: 'esm',
				sourcemap: true,
			},
		],
		external,
		plugins,
	},
	// React
	{
		input: 'src/react/index.tsx',
		output: [
			{
				file: 'dist/react/index.js',
				format: 'esm',
				sourcemap: true,
			},
		],
		external,
		plugins,
	},
	// Vue
	{
		input: 'src/vue/index.ts',
		output: [
			{
				file: 'dist/vue/index.js',
				format: 'esm',
				sourcemap: true,
			},
		],
		external,
		plugins,
	},
]
