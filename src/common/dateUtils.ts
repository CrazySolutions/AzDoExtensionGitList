export function formatRelativeDate(date: Date | null | undefined): string {
    if (date === undefined) return "—";
    if (date === null) return "Never";
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    const weeks = Math.floor(diffDays / 7);
    if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
    const months = Math.floor(diffDays / 30);
    if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
    const years = Math.floor(diffDays / 365);
    return `${years} year${years === 1 ? "" : "s"} ago`;
}
