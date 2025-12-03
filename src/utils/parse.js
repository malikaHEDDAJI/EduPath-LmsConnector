export function parseDateSafe(value) {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d)) return null;
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

export function parseNumberSafe(value) {
    const n = Number(value);
    return isNaN(n) ? null : n;
}

export function parseStringSafe(value) {
    if (!value) return null;
    const str = String(value).trim();
    return str.length === 0 ? null : str;
}
