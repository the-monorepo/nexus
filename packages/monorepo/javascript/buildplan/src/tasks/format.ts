import { formatPipes } from "./pipes/formatPipes.ts";
import gulp from "gulp";
import config from "@monorepo/config";
import streamToPromise from "stream-to-promise";

const formatStream = (options?) =>
	gulp.src(
		[
			...config.formatableGlobs,
			...config.formatableIgnoreGlobs.map((glob) => `!${glob}`),
		],
		{
			base: ".",
			nodir: true,
			...options,
		},
	);

const format = async () => {
	const processedStream = await formatPipes(formatStream());
	const destStream = processedStream.pipe(gulp.dest("."));
	return streamToPromise(destStream);
};

export default format;
