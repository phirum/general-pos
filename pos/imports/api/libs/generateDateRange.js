
export const  getRange = function(date, type) {
    obj = {};
    var day, now, range;
    range = undefined;
    day = new Date(date).getDate();
    now = new Date(date);
    range = 31;
    startDate = '';
    endDate = '';
    onFeb = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (var i = 1; i <= range; i += type) {
        for (var j = i; j < i + type; j++) {
            if (day <= j) {
                if (now.getMonth() + 1 == 2) {
                    if (j + type > 30) {
                        endDate = moment(now.setDate(onFeb)).format('YYYY-MM-DD');
                        break;
                    } else {
                        endDate = moment(now.setDate((i + type) - 1)).format('YYYY-MM-DD');
                        break;
                    }

                } else {
                    if (i + type > 40) {
                        lastDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                        endDate = moment(lastDate).format('YYYY-MM-DD');
                        break;
                    } else if (i + type > 30) {
                        lastDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                        endDate = moment(lastDate).format('YYYY-MM-DD');
                        break;
                    } else {
                        endDate = moment(now.setDate((i + type) - 1)).format('YYYY-MM-DD');
                        break;
                    }
                }
            }
        }
        last = moment(endDate).format('DD');
        if (last == '31') {
            setEndDate = parseInt(last) - type;
            startDate = moment(now.setDate(setEndDate)).format('YYYY-MM-DD');
        } else {
            startDate = moment(now.setDate(i)).format('YYYY-MM-DD');
        }
        if (endDate != '') break;
    }
    return {
        startDate: startDate,
        endDate: endDate
    };
};

