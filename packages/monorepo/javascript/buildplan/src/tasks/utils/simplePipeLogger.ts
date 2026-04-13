import chalk from "chalk";
import through from "through2";

export const simplePipeLogger = (l) => {
	return through.obj((file, enc, callback) => {
		l.info(`'${chalk.cyanBright(file.relative)}'`);
		callback(null, file);
	});
};
