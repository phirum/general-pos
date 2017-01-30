export default class TranslateDate {
    static month({date, isTranslate}) {
        let translateMonth = '';
        let monthAsString = moment(date).format('M');
        let currentSelectMonth = moment(date).format('MMMM');
        switch (monthAsString) {
            case '1':
                translateMonth = isTranslate ? 'ខែមករា' : currentSelectMonth;
                break;
            case '2':
                translateMonth = isTranslate ? 'ខែកុម្ភៈ' : currentSelectMonth;
                break;
            case '3':
                translateMonth = isTranslate ? 'ខែមីនា' : currentSelectMonth;
                break;
            case '4':
                translateMonth = isTranslate ? 'ខែមេសា' : currentSelectMonth;
                break;
            case '5':
                translateMonth = isTranslate ? 'ខែឧសភា' : currentSelectMonth;
                break;
            case '6':
                translateMonth = isTranslate ? 'ខែមិថុនា' : currentSelectMonth;
                break;
            case '7':
                translateMonth = isTranslate ? 'ខែកក្កដា' : currentSelectMonth;
                break;
            case '8':
                translateMonth = isTranslate ? 'ខែសីហា' : currentSelectMonth;
                break;
            case '9':
                translateMonth = isTranslate ? 'ខែកញ្ញា' : currentSelectMonth;
                break;
            case '10':
                translateMonth = isTranslate ? 'ខែតុលា' : currentSelectMonth;
                break;
            case '11':
                translateMonth = isTranslate ? 'ខែវិច្ឆិកា' : currentSelectMonth;
                break;
            case '12':
                translateMonth = isTranslate ? 'ខែធ្នូ' : currentSelectMonth;
                break;
        }
        return translateMonth;
    }

    static day({date, isTranslate}){
        let translateDay = '';
        let dayAsString = moment(date).format('d');
        let currentSelectDay = moment(date).format('dddd');
        switch (dayAsString) {
            case '0':
                translateDay = isTranslate ? 'ថ្ងៃអាទិត្យ' : currentSelectDay;
                break;
            case '1':
                translateDay = isTranslate ? 'ថ្ងៃច័ន្ទ' : currentSelectDay;
                break;
            case '2':
                translateDay = isTranslate ? 'ថ្ងៃអង្គារ' : currentSelectDay;
                break;
            case '3':
                translateDay = isTranslate ? 'ថ្ងៃពុធ' : currentSelectDay;
                break;
            case '4':
                translateDay = isTranslate ? 'ថ្ងៃព្រហស្បត្តិ៍' : currentSelectDay;
                break;
            case '5':
                translateDay = isTranslate ? 'ថ្ងៃសុក្រ' : currentSelectDay;
                break;
            case '6':
                translateDay = isTranslate ? 'ថ្ងៃសៅរ៍' : currentSelectDay;
        }
        return translateDay;
    }
    static render({date, isTranslate}){
        return {
            dayAsNumber: moment(date).format('DD'),
            day: this.day({date, isTranslate: isTranslate}),
            month: this.month({date, isTranslate: isTranslate}),
            year: moment(date).format('YYYY')
        }
    }
};