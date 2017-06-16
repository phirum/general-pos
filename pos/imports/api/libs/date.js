import {Closing} from '../collections/closing';
export default class RangeDate {
    static today() {
        return {start: moment().startOf('days'), end: moment().endOf('days')}
    }

    static yesterday() {
        return {start: moment().subtract(1, 'days').startOf('days'), end: moment().subtract(1, 'days').endOf('days')}
    }

    static last7days() {
        return {start: moment().subtract(7, 'days').startOf('days'), end: moment().endOf('days')};
    }

    static last30days() {
        return {start: moment().subtract(30, 'days').startOf('days'), end: moment().endOf('days')}
    }

    static thisMonth() {
        return {start: moment().startOf('months'), end: moment().endOf('months')}
    }

    static lastMonth() {
        return {
            start: moment().subtract(1, 'months').startOf('months'),
            end: moment().subtract(1, 'months').endOf('months')
        };
    }

    static subtractMonthBy({date, amountOfSubtract}) {
        return {date: moment(date).subtract(amountOfSubtract, 'months')}
    }

    static addMonthBy({date, amountOfAdd}) {
        return {date: moment(date).add(amountOfAdd, 'months')}
    }

    static subtractDayBy({date, amountOfSubtract}) {
        return {date: moment(date).subtract(amountOfSubtract, 'days')}
    }

    static addDayBy({date, amountOfAdd}) {
        return {date: moment(date).subtract(amountOfAdd, 'days')}
    }

    static checkMinPlusOneDay(elm) {
        let closing = Closing.findOne({});
        elm.data("DateTimePicker").minDate(closing ? moment(closing.closingDate).add(1, 'days').toDate() : false)
    }

    static checkMin(elm) {
        let closing = Closing.findOne({});
        elm.data("DateTimePicker").minDate(closing ? moment(closing.closingDate).toDate() : false)
    }

    static setMin(elm, date) {
        elm.data("DateTimePicker") && elm.data("DateTimePicker").minDate(date ? moment(date).toDate() : false)

    }
};
