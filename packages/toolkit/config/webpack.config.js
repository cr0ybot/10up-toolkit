/**
 * Internal dependencies
 */
const {
	getBuildFiles,
	getTenUpScriptsConfig,
	getTenUpScriptsPackageBuildConfig,
} = require('../utils');
const { getModuleBuildFiles } = require('../utils/config');

const {
	getEntryPoints,
	getOutput,
	getExternals,
	getPlugins,
	getStats,
	getOptimization,
	getModules,
	getResolve,
	getTarget,
	getPerformance,
	getDevServer,
} = require('./webpack');

const projectConfig = getTenUpScriptsConfig();
const packageConfig = getTenUpScriptsPackageBuildConfig();
const { source, main } = packageConfig;
const buildFiles = getBuildFiles();
const moduleBuildFiles = getModuleBuildFiles();

// assume it's a package if there's source and main
const isPackage = typeof source !== 'undefined' && typeof main !== 'undefined';
const isProduction = process.env.NODE_ENV === 'production';
const mode = isProduction ? 'production' : 'development';
const useScriptModules = projectConfig.useScriptModules || false;

const defaultTargets = [
	'> 1%',
	'Firefox ESR',
	'last 2 versions',
	'not ie <= 11',
	'not ie_mob <=11',
];

const config = {
	projectConfig,
	packageConfig,
	buildFiles,
	moduleBuildFiles,
	isPackage,
	mode,
	isProduction,
	defaultTargets,
};

const baseConfig = {
	devtool: !isProduction || projectConfig.sourcemap ? 'source-map' : false,
	mode,
	devServer: getDevServer(config),
	output: getOutput(config),
	target: getTarget(config),
	resolve: getResolve(config),
	externals: getExternals(config),
	performance: getPerformance(config),
	module: getModules(config),
	plugins: getPlugins(config),
	stats: getStats(config),
	optimization: getOptimization(config),
	experiments: {
		outputModule: packageConfig.packageType === 'module',
	},
};

const scriptsConfig = {
	...baseConfig,
	entry: () => getEntryPoints({ ...config, buildType: 'script' }),
};

const moduleConfig = {
	...baseConfig,

	entry: () => getEntryPoints({ ...config, buildType: 'module' }),
	plugins: getPlugins({ ...config, isModule: true }),
	devServer: getDevServer({ ...config, isModule: true }),
	module: getModules({ ...config, isModule: true }),
	target: getTarget({ ...config, isModule: true }),

	experiments: {
		...baseConfig.experiments,
		outputModule: true,
	},

	output: {
		clean: false,
		module: true,
		chunkFormat: 'module',
		library: {
			...baseConfig.output.library,
			type: 'module',
		},
		filename: (pathData) => {
			const isBlockAsset =
				moduleBuildFiles[pathData.chunk.name].match(/\/blocks?\//) ||
				moduleBuildFiles[pathData.chunk.name].match(/\\blocks?\\/);
			return isBlockAsset ? projectConfig.filenames.block : projectConfig.filenames.js;
		},
	},
};

module.exports = useScriptModules ? [scriptsConfig, moduleConfig] : scriptsConfig;
