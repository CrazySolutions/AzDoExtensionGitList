import { formatRelativeDate } from "../../src/common/dateUtils";

function daysAgo(n: number): Date {
    return new Date(Date.now() - n * 86_400_000);
}

describe("formatRelativeDate", () => {
    it('returns "—" for undefined', () => {
        expect(formatRelativeDate(undefined)).toBe("—");
    });

    it('returns "Never" for null', () => {
        expect(formatRelativeDate(null)).toBe("Never");
    });

    it('returns "Today" for a date less than 1 day ago', () => {
        expect(formatRelativeDate(new Date(Date.now() - 3_600_000))).toBe("Today");
    });

    it('returns "Yesterday" for exactly 1 day ago', () => {
        expect(formatRelativeDate(daysAgo(1))).toBe("Yesterday");
    });

    it('returns "X days ago" for 2–6 days ago', () => {
        expect(formatRelativeDate(daysAgo(3))).toBe("3 days ago");
        expect(formatRelativeDate(daysAgo(6))).toBe("6 days ago");
    });

    it('returns "1 week ago" for 7 days ago', () => {
        expect(formatRelativeDate(daysAgo(7))).toBe("1 week ago");
    });

    it('returns "X weeks ago" for 8–34 days ago', () => {
        expect(formatRelativeDate(daysAgo(14))).toBe("2 weeks ago");
        expect(formatRelativeDate(daysAgo(28))).toBe("4 weeks ago");
    });

    it('returns "X month(s) ago" for 35–364 days ago', () => {
        expect(formatRelativeDate(daysAgo(35))).toBe("1 month ago");
        expect(formatRelativeDate(daysAgo(60))).toBe("2 months ago");
        expect(formatRelativeDate(daysAgo(300))).toBe("10 months ago");
    });

    it('returns "X year(s) ago" for 365+ days ago', () => {
        expect(formatRelativeDate(daysAgo(365))).toBe("1 year ago");
        expect(formatRelativeDate(daysAgo(730))).toBe("2 years ago");
    });
});
