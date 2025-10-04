import type { BaselineLevel, FeatureRecord, BrowserSupport } from './types.js';

// Types loosely based on web-features package shape
type WebFeature = {
	name: string;
	slug?: string;
	status?: { 
		baseline?: 'low' | 'high' | false; 
		baseline_low_date?: string; 
		baseline_high_date?: string;
		support?: BrowserSupport;
	};
	bcd?: string | string[];
	description?: string;
	spec?: string | string[];
};

export function mapWebFeatureToRecord(id: string, f: WebFeature): FeatureRecord | null {
	const baseline = f.status?.baseline === 'high' ? 'widely' : f.status?.baseline === 'low' ? 'newly' : 'limited';
	const since = f.status?.baseline_high_date || f.status?.baseline_low_date;
	const bcdId = Array.isArray(f.bcd) ? f.bcd[0] : f.bcd;
	const support = f.status?.support;
	
	return {
		id,
		name: f.name || id,
		status: { 
			baseline: baseline as BaselineLevel, 
			since: since || undefined,
			support: support || undefined
		},
		bcdId: bcdId,
		description: f.description,
		spec: f.spec
	};
}

