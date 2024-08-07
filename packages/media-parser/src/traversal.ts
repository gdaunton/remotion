import type {MoovBox} from './boxes/iso-base-media/moov/moov';
import type {MvhdBox} from './boxes/iso-base-media/mvhd';
import type {StcoBox} from './boxes/iso-base-media/stsd/stco';
import type {StsdBox} from './boxes/iso-base-media/stsd/stsd';
import type {StszBox} from './boxes/iso-base-media/stsd/stsz';
import type {TkhdBox} from './boxes/iso-base-media/tkhd';
import type {TrakBox} from './boxes/iso-base-media/trak/trak';
import type {AnySegment, RegularBox} from './parse-result';

export const getMoovBox = (segments: AnySegment[]): MoovBox | null => {
	const moovBox = segments.find((s) => s.type === 'moov-box');
	if (!moovBox || moovBox.type !== 'moov-box') {
		return null;
	}

	return moovBox;
};

export const getMvhdBox = (moovBox: MoovBox): MvhdBox | null => {
	const mvHdBox = moovBox.children.find((s) => s.type === 'mvhd-box');

	if (!mvHdBox || mvHdBox.type !== 'mvhd-box') {
		return null;
	}

	return mvHdBox;
};

export const getTraks = (moovBox: MoovBox): TrakBox[] => {
	return moovBox.children.filter((s) => s.type === 'trak-box') as TrakBox[];
};

export const getTkhdBox = (trakBox: TrakBox): TkhdBox | null => {
	const tkhdBox = trakBox.children.find(
		(s) => s.type === 'tkhd-box',
	) as TkhdBox | null;

	return tkhdBox;
};

export const getStblBox = (trakBox: TrakBox): RegularBox | null => {
	const mdiaBox = trakBox.children.find(
		(s) => s.type === 'regular-box' && s.boxType === 'mdia',
	);

	if (!mdiaBox || mdiaBox.type !== 'regular-box') {
		return null;
	}

	const minfBox = mdiaBox.children.find(
		(s) => s.type === 'regular-box' && s.boxType === 'minf',
	);

	if (!minfBox || minfBox.type !== 'regular-box') {
		return null;
	}

	const stblBox = minfBox.children.find(
		(s) => s.type === 'regular-box' && s.boxType === 'stbl',
	);

	if (!stblBox || stblBox.type !== 'regular-box') {
		return null;
	}

	return stblBox;
};

export const getStsdBox = (trakBox: TrakBox): StsdBox | null => {
	const stblBox = getStblBox(trakBox);

	if (!stblBox || stblBox.type !== 'regular-box') {
		return null;
	}

	const stsdBox = stblBox.children.find(
		(s) => s.type === 'stsd-box',
	) as StsdBox | null;

	return stsdBox;
};

export const getStcoBox = (trakBox: TrakBox): StcoBox | null => {
	const stblBox = getStblBox(trakBox);

	if (!stblBox || stblBox.type !== 'regular-box') {
		return null;
	}

	const stcoBox = stblBox.children.find(
		(s) => s.type === 'stco-box',
	) as StcoBox | null;

	return stcoBox;
};

export const getStszBox = (trakBox: TrakBox): StszBox | null => {
	const stblBox = getStblBox(trakBox);

	if (!stblBox || stblBox.type !== 'regular-box') {
		return null;
	}

	const stszBox = stblBox.children.find(
		(s) => s.type === 'stsz-box',
	) as StszBox | null;

	return stszBox;
};
