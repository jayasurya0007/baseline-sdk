export function mapWebFeatureToRecord(id, f) {
    const baseline = f.status?.baseline === 'high' ? 'widely' : f.status?.baseline === 'low' ? 'newly' : 'limited';
    const since = f.status?.baseline_high_date || f.status?.baseline_low_date;
    const bcdId = Array.isArray(f.bcd) ? f.bcd[0] : f.bcd;
    return {
        id,
        name: f.name || id,
        status: { baseline: baseline, since: since || undefined },
        bcdId: bcdId
    };
}
//# sourceMappingURL=webFeatures.js.map