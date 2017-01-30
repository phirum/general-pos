//npm
//schema
import {selectReport} from '../../api/collections/reports/mainReport';
//pages
import './main.html';

let indexTmpl = Template.Pos_mainReport;

indexTmpl.helpers({
    schema(){
        return selectReport;
    },
    selectOptions(){
        return [
            {
                label: 'Invoice', value: 'invoiceReport'
            },
            {
                label: 'Invoice By Customer', value: 'invoiceByCustomerReport'
            },
            {
                label: 'Invoice By Item', value: 'invoiceByItemReport'
            },
            {
                label: 'Bill By Item', value: 'billByItemReport'
            },
            {
                label: 'Receive Payment', value: 'paymentReport'
            },
            {
                label: 'Stock Balance', value: 'stockBalance'
            },
            {
                label: 'Location Transfer', value: 'locationTransfer'
            },
            {
                label: 'Ring Pull Transfer', value: 'ringPullTransfer'
            },
            {
                label: 'Bill', value: 'bill'
            },
            {
                label: 'Bill By Vendor', value: 'billByVendorReport'
            },
            {
                label: 'Prepaid Order', value: 'prepaidOrder'
            },
            {
                label: 'Lending Stock', value: 'lendingStock'
            },
            {
                label: 'Company Exchange Ring Pull', value: 'companyExchangeRingPull'
            },
            {
                label: 'Exchange Gratis', value: 'exchangeGratis'
            },
            {
                label: 'Exchange Ring Pull', value: 'exchangeRingPull'
            },
            {
                label: 'Sale Order', value: 'saleOrder'
            },
            {
                label: 'Group Report', value: 'groupReport'
            },
            {
                label: 'Group Bill Report', value: 'groupBillReport'
            },
            {
                label: 'Customer Term Balance Report', value: 'termCustomerBalance'
            },
            {
                label: 'Customer Group Balance Report', value: 'groupCustomerBalance'
            },
            {
                label: 'Receive Item Summary', value: 'receiveItemSummary'
            },
            {
                label: 'Ring Pull Exchange Ending', value: 'exchangeRingPullStockBalance'
            },
            {
                label: 'Transfer Money', value: 'transferMoney'
            },
        ]
    }
});

indexTmpl.events({
    'change [name="goToReport"]'(event, instance){
        if (event.currentTarget.value != '') {
            FlowRouter.go(getDefaultReportParams(event.currentTarget.value));
        }
    }
});

function getDefaultReportParams(reportName) {
    let params = '';
    switch (reportName) {
        case 'invoiceReport':
            params = `/pos/report/invoice?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}`;
            break;
        case 'invoiceByCustomerReport':
            params = `/pos/report/invoiceByCustomer?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}`;
            break;
        case 'invoiceByItemReport':
            params = `/pos/report/invoiceByItemReport?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}`;
            break;
        case 'billByItemReport':
            params = `/pos/report/billByItemReport?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}`;
            break;
        case 'paymentReport':
            params = `/pos/report/payment?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}`;
            break;
        case 'stockBalance':
            params = `/pos/report/stockBalance?date=${moment().format('YYYY-MM-DD 23:59:59')}&branch=${Session.get('currentBranch')}`;
            break;
        case 'termCustomerBalance':
            params = `/pos/report/termCustomerBalance?date=${moment().format('YYYY-MM-DD 23:59:59')}`;
            break;
        case 'groupCustomerBalance':
            params = `/pos/report/groupCustomerBalance?date=${moment().format('YYYY-MM-DD 23:59:59')}`;
            break;
        case 'locationTransfer':
            params = `/pos/report/locationTransfer?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}&fromBranch=${Session.get('currentBranch')}`;
            break;
        case 'transferMoney':
            params = `/pos/report/transferMoneyReport?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}&fromBranch=${Session.get('currentBranch')}`;
            break;
        case 'ringPullTransfer':
            params = `/pos/report/ringPullTransfer?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}&fromBranch=${Session.get('currentBranch')}`;
            break;
        case 'bill':
            params = `/pos/report/billReport?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}&branch=${Session.get('currentBranch')}`;
            break;
        case 'billByVendorReport':
            params = `/pos/report/billByVendorReport?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}&branch=${Session.get('currentBranch')}`;
            break;
        case 'prepaidOrder':
            params = `/pos/report/prepaidOrderReport?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}&branch=${Session.get('currentBranch')}`;
            break;
        case 'exchangeGratis':
            params = `/pos/report/exchangeGratisReport?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}&branch=${Session.get('currentBranch')}`;
            break;
        case 'companyExchangeRingPull':
            params = `/pos/report/companyExchangeRingPullReport?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}&branch=${Session.get('currentBranch')}`;
            break;
        case 'exchangeRingPull':
            params = `/pos/report/exchangeRingPullReport?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}&branch=${Session.get('currentBranch')}`;
            break;
        case 'saleOrder':
            params = `/pos/report/saleOrderReport?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}&branch=${Session.get('currentBranch')}`;
            break;
        case 'groupReport':
            params = `/pos/report/groupReport?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 00:00:00')}&branch=${Session.get('currentBranch')}`;
            break;
        case 'groupBillReport':
            params = `/pos/report/groupBillReport?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 00:00:00')}&branch=${Session.get('currentBranch')}`;
            break;
        case 'receiveItemSummary':
            params = `/pos/report/receiveItemSummary?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}&branch=${Session.get('currentBranch')}`;
            break;
        case 'lendingStock':
            params = `/pos/report/lendingStockReport?date=${moment().format('YYYY-MM-DD 00:00:00')},${moment().format('YYYY-MM-DD 23:59:59')}&branch=${Session.get('currentBranch')}`;
            break;
        case 'exchangeRingPullStockBalance':
            params = `/pos/report/exchangeRingPullStockBalance?date=${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branch=${Session.get('currentBranch')}`;
            break;
    }
    return params;
}
