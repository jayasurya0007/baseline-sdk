import type { BaselineLevel, FeatureRecord } from './types.js';

// Types loosely based on web-features package shape
type WebFeature = {
	name: string;
	slug?: string;
	status?: { baseline?: 'low' | 'high' | false; baseline_low_date?: string; baseline_high_date?: string };
	bcd?: string | string[];
};

export function mapWebFeatureToRecord(id: string, f: WebFeature): FeatureRecord | null {
	const baseline = f.status?.baseline === 'high' ? 'widely' : f.status?.baseline === 'low' ? 'newly' : 'limited';
	const since = f.status?.baseline_high_date || f.status?.baseline_low_date;
	const bcdId = Array.isArray(f.bcd) ? f.bcd[0] : f.bcd;
	return {
		id,
		name: f.name || id,
		status: { baseline: baseline as BaselineLevel, since: since || undefined },
		bcdId: bcdId
	};
}

