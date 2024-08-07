import type {SttsBox} from './boxes/iso-base-media/stts/stts';
import type {TrakBox} from './boxes/iso-base-media/trak/trak';
import type {AnySegment} from './parse-result';
import {getMoovBox, getMvhdBox, getStsdBox, getTraks} from './traversal';

const calculateFps = ({
	sttsBox,
	timeScale,
	durationInSamples,
}: {
	sttsBox: SttsBox;
	timeScale: number;
	durationInSamples: number;
}) => {
	let totalSamples = 0;

	for (const sample of sttsBox.sampleDistribution) {
		totalSamples += sample.sampleCount;
	}

	const durationInSeconds = durationInSamples / timeScale;
	const fps = totalSamples / durationInSeconds;

	return fps;
};

type TimescaleAndDuration = {
	timescale: number;
	duration: number;
};

export const trakBoxContainsAudio = (trakBox: TrakBox): boolean => {
	const stsd = getStsdBox(trakBox);
	if (!stsd) {
		return false;
	}

	const videoSample = stsd.samples.find((s) => s.type === 'audio');
	if (!videoSample || videoSample.type !== 'audio') {
		return false;
	}

	return true;
};

export const trakBoxContainsVideo = (trakBox: TrakBox): boolean => {
	const stsd = getStsdBox(trakBox);
	if (!stsd) {
		return false;
	}

	const videoSample = stsd.samples.find((s) => s.type === 'video');
	if (!videoSample || videoSample.type !== 'video') {
		return false;
	}

	return true;
};

export const getTimescaleAndDuration = (
	boxes: AnySegment[],
): TimescaleAndDuration | null => {
	const moovBox = getMoovBox(boxes);
	if (!moovBox) {
		return null;
	}

	const trackBoxes = getTraks(moovBox);

	const trackBox = trackBoxes.find(trakBoxContainsVideo);
	if (!trackBox || trackBox.type !== 'trak-box') {
		return null;
	}

	const trackBoxChildren = trackBox.children;
	if (!trackBoxChildren || trackBoxChildren.length === 0) {
		return null;
	}

	const mdiaBox = trackBoxChildren.find(
		(c) => c.type === 'regular-box' && c.boxType === 'mdia',
	);
	if (
		!mdiaBox ||
		mdiaBox.type !== 'regular-box' ||
		mdiaBox.boxType !== 'mdia'
	) {
		return null;
	}

	const mdhdBox = mdiaBox?.children.find((c) => c.type === 'mdhd-box');
	if (mdhdBox && mdhdBox.type === 'mdhd-box') {
		return {timescale: mdhdBox.timescale, duration: mdhdBox.duration};
	}

	const mvhdBox = getMvhdBox(moovBox);
	if (!mvhdBox) {
		return null;
	}

	const {timeScale, durationInUnits} = mvhdBox;
	return {timescale: timeScale, duration: durationInUnits};
};

export const getFps = (segments: AnySegment[]) => {
	const timescaleAndDuration = getTimescaleAndDuration(segments);
	if (!timescaleAndDuration) {
		return null;
	}

	const moovBox = getMoovBox(segments);
	if (!moovBox) {
		return null;
	}

	const mvhdBox = getMvhdBox(moovBox);
	if (!mvhdBox) {
		return null;
	}

	const trackBoxes = getTraks(moovBox);

	const trackBox = trackBoxes.find(trakBoxContainsVideo);
	if (!trackBox || trackBox.type !== 'trak-box') {
		return null;
	}

	const trackBoxChildren = trackBox.children;
	if (!trackBoxChildren || trackBoxChildren.length === 0) {
		return null;
	}

	const mdiaBox = trackBoxChildren.find(
		(c) => c.type === 'regular-box' && c.boxType === 'mdia',
	);
	if (
		!mdiaBox ||
		mdiaBox.type !== 'regular-box' ||
		mdiaBox.boxType !== 'mdia'
	) {
		return null;
	}

	const minfBox = mdiaBox.children.find(
		(c) => c.type === 'regular-box' && c.boxType === 'minf',
	);
	if (
		!minfBox ||
		minfBox.type !== 'regular-box' ||
		minfBox.boxType !== 'minf'
	) {
		return null;
	}

	const stblBox = minfBox.children.find(
		(c) => c.type === 'regular-box' && c.boxType === 'stbl',
	);
	if (
		!stblBox ||
		stblBox.type !== 'regular-box' ||
		stblBox.boxType !== 'stbl'
	) {
		return null;
	}

	const sttsBox = stblBox.children.find((c) => c.type === 'stts-box');
	if (!sttsBox || sttsBox.type !== 'stts-box') {
		return null;
	}

	return calculateFps({
		sttsBox,
		timeScale: timescaleAndDuration.timescale,
		durationInSamples: timescaleAndDuration.duration,
	});
};

export const hasFps = (boxes: AnySegment[]): boolean => {
	try {
		return getFps(boxes) !== null;
	} catch (err) {
		return false;
	}
};
