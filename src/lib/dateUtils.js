export const getFiscalYearPresets = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed, April is 3

    // If we are before April, the "current" FY started last year
    const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;

    const presets = [];
    for (let i = 0; i < 4; i++) {
        const year = fyStartYear - i;
        const shortStart = year.toString().slice(-2);
        const shortEnd = (year + 1).toString().slice(-2);
        presets.push(`FY ${shortStart}-${shortEnd}`);
    }
    return presets;
};

export const getStartOfRange = (range, customRange) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (range === 'Custom' && customRange?.start) {
        return new Date(customRange.start);
    }

    switch (range) {
        case 'Today':
            return start;
        case 'Yesterday':
            start.setDate(start.getDate() - 1);
            return start;
        case 'This Week':
            start.setDate(start.getDate() - start.getDay());
            return start;
        case 'Last Week':
            start.setDate(start.getDate() - start.getDay() - 7);
            return start;
        case 'This Month':
            return new Date(now.getFullYear(), now.getMonth(), 1);
        case 'Last Month':
            return new Date(now.getFullYear(), now.getMonth() - 1, 1);
        case 'Last 30 Days':
            start.setDate(start.getDate() - 30);
            return start;
        case 'This Year':
            return new Date(now.getFullYear(), 0, 1);
        case 'Last Year':
            return new Date(now.getFullYear() - 1, 0, 1);
        case 'Last Quarter':
            const q = Math.floor(now.getMonth() / 3);
            const prevQStart = new Date(now.getFullYear(), (q - 1) * 3, 1);
            return prevQStart;
        case 'All':
            return new Date(0);
        default:
            if (range.startsWith('FY ')) {
                const years = range.replace('FY ', '').split('-');
                const startYear = 2000 + parseInt(years[0]);
                return new Date(startYear, 3, 1);
            }
            return new Date(now.getFullYear(), 0, 1);
    }
};

export const getEndOfRange = (range, customRange) => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (range === 'Custom' && customRange?.end) {
        return new Date(customRange.end);
    }

    switch (range) {
        case 'Yesterday':
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
        case 'Last Week':
            const lastWeekEnd = new Date();
            lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay() - 1);
            return new Date(lastWeekEnd.getFullYear(), lastWeekEnd.getMonth(), lastWeekEnd.getDate(), 23, 59, 59);
        case 'Last Month':
            return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        case 'Last Year':
            return new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        case 'This Week':
            const thisWeekEnd = new Date(now);
            thisWeekEnd.setDate(now.getDate() - now.getDay() + 6);
            return new Date(thisWeekEnd.getFullYear(), thisWeekEnd.getMonth(), thisWeekEnd.getDate(), 23, 59, 59);
        case 'This Month':
            return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        case 'This Year':
            return new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        case 'All':
            return new Date(2099, 11, 31);
        default:
            if (range.startsWith('FY ')) {
                const years = range.replace('FY ', '').split('-');
                const endYear = 2000 + parseInt(years[1]);
                return new Date(endYear, 2, 31, 23, 59, 59);
            }
            return end;
    }
};

export const getPreviousPeriodRange = (range, customRange) => {
    const currentStart = getStartOfRange(range, customRange);
    const currentEnd = getEndOfRange(range, customRange);

    if (range === 'All') return { start: new Date(0), end: new Date(0) };

    const now = new Date();
    switch (range) {
        case 'Today':
            return {
                start: new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate() - 1),
                end: new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate() - 1, 23, 59, 59)
            };
        case 'Yesterday':
            return {
                start: new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate() - 1),
                end: new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate() - 1, 23, 59, 59)
            };
        case 'This Month':
            return {
                start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
            };
        case 'Last Month':
            return {
                start: new Date(now.getFullYear(), now.getMonth() - 2, 1),
                end: new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59)
            };
        case 'This Year':
            return {
                start: new Date(now.getFullYear() - 1, 0, 1),
                end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)
            };
        default:
            const duration = currentEnd.getTime() - currentStart.getTime();
            return {
                start: new Date(currentStart.getTime() - duration - 1000),
                end: new Date(currentStart.getTime() - 1000)
            };
    }
};
