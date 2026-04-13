import chalk from "chalk";

import logger from "./utils/logger.ts";
import { webpackCompilers } from "./utils/webpack-compilers.ts";

const serveBundles = async () => {
	const { WebpackDevServer } = await import("@pshaw/webpack");
	const compilers = await webpackCompilers();
	let port = 3000;
	const l = logger.child(chalk.magentaBright("webpack"));
	for (const { compiler, config } of compilers) {
		const mergedDevServerConfig = config.devServer;
		const server = new WebpackDevServer(mergedDevServerConfig, compiler as any);
		const serverPort =
			config.devServer.port !== undefined ? config.devServer.port : port;
		await server.start(serverPort, "localhost");
		l.info(
			`Serving '${chalk.cyanBright(config.name)}' on port ${chalk.cyanBright(
				serverPort.toString(),
			)}...`,
		);

		port++;
	}
};

export default serveBundles;
