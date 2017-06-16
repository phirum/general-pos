import {Template} from 'meteor/templating';
import {TAPi18n} from 'meteor/tap:i18n';
import 'meteor/tap:i18n-ui';

// Page
import './sidebar-menu.html';

Tracker.autorun(function () {
    if (Meteor.userId() || Session.get('currentBranch')) {
        Meteor.call('currentUserStockAndAccountMappingDoc', {
            userId: Meteor.userId(),
            branchId: Session.get('currentBranch')
        }, function (err, result) {
            Session.set('currentUserStockAndAccountMappingDoc', result);
        });
    }
});

Template.Pos_sidebarMenu.helpers({
    // customer
    groupBalance() {
        return `/pos/report/groupCustomerBalance?date=${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}`;
    },
    termBalance() {
        return `/pos/report/termCustomerBalance?date=${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}`;
    },
    customerHistory() {
        return `/pos/report/customerHistory?date=${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branchId=${Session.get('currentBranch')}`;
    },
    customerDebtTracking() {
        return `/pos/report/customer-debt-tracking?date=${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branchId=${Session.get('currentBranch')}`;
    },
    customerTotalCredit(){
        return `/pos/report/customer-total-credit?date=${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branchId=${Session.get('currentBranch')}`;
    },
    invoiceByCustomer() {
        return `/pos/report/invoiceByCustomer?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}`;
    },
    invoiceSummary() {
        return `/pos/report/invoice?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}`;
    },
    invoiceByItem() {
        return `/pos/report/invoiceByItemReport?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branchId=${Session.get('currentBranch')}`;
    },
    groupInvoice() {
        return `/pos/report/groupReport?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')}&branch=${Session.get('currentBranch')}`;
    },
    receivePayment() {
        return `/pos/report/payment?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branchId=${Session.get('currentBranch')}`;
    },
    saleOrder() {
        return `/pos/report/saleOrderReport?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')}&branch=${Session.get('currentBranch')}`;
    },
    unpaidInvoiceOverdue(){
        return `/pos/report/unpaidInvoiceOverdue?date=${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branch=${Session.get('currentBranch')}`
    },
    unpaidGroupInvoiceOverdue(){
        return `/pos/report/unpaidGroupInvoiceOverdue?date=${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branch=${Session.get('currentBranch')}`
    },
    // Vendor
    vendorBalanceSummary() {
        return `/pos/report/vendor-balance-summary?branchId=${Session.get('currentBranch')}`;
    },
    bill() {
        return `/pos/report/billReport?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branch=${Session.get('currentBranch')}`;
    },
    billByItem() {
        return `/pos/report/billByItemReport?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&type=Term&branchId=${Session.get('currentBranch')}`;
    },
    billByVendor() {
        return `/pos/report/billByVendorReport?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branchId=${Session.get('currentBranch')}`;
    },
    groupBill() {
        return `/pos/report/groupBillReport?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')}&branch=${Session.get('currentBranch')}`;
    },
    payEnterBill() {
        return `/pos/report/payBill?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branchId=${Session.get('currentBranch')}`;
    },
    prepaidOrder() {
        return `/pos/report/prepaidOrderReport?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD 23:59:59')}&branch=${Session.get('currentBranch')}`;
    },
    prepaidOrderDetail() {
        return `/pos/report/prepaid-order-detail?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD 23:59:59')}&branchId=${Session.get('currentBranch')}`;
    },
    prepaidOrderBalance() {
        return `/pos/report/prepaid-order-balance?date=${moment().endOf('days').format('YYYY-MM-DD 23:59:59')}&branchId=${Session.get('currentBranch')}`;
    },
    // Data
    companyExchangeRingPull() {
        return `/pos/report/companyExchangeRingPullReport?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branch=${Session.get('currentBranch')}`;
    },
    exchangeGratis() {
        return `/pos/report/exchangeGratisReport?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branch=${Session.get('currentBranch')}`;
    },
    exchangeRingPull() {
        return `/pos/report/exchangeRingPullReport?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branch=${Session.get('currentBranch')}`;
    },
    exchangeRingPullStockBalance() {
        return `/pos/report/exchangeRingPullStockBalance?date=${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branch=${Session.get('currentBranch')}`;
    },
    lendingStock() {
        return `/pos/report/lendingStockReport?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD hh:mm:ss')}&branchId=${Session.get('currentBranch')}`;
    },
    locationTransfer() {
        return `/pos/report/locationTransfer?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&fromBranch=${Session.get('currentBranch')}`;
    },
    receiveItemSummary() {
        return `/pos/report/receiveItemSummary?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branch=${Session.get('currentBranch')}`;
    },
    ringPullTransfer() {
        return `/pos/report/ringPullTransfer?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&fromBranch=${Session.get('currentBranch')}`;
    },
    transferMoney() {
        return `/pos/report/transferMoneyReport?date=${moment().startOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&fromBranch=${Session.get('currentBranch')}`;
    },
    stockBalance(){
        return `/pos/report/stockBalance?date=${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branch=${Session.get('currentBranch')}`;
    },
    stockDetail(){
        return `/pos/report/stockDetail?date=${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')},${moment().endOf('days').format('YYYY-MM-DD HH:mm:ss')}&branch=${Session.get('currentBranch')}`;
    },
    ringPullSummary(){
        return `/pos/report/ringpullSummary?asDate=${moment().endOf('days').format('YYYY-MM-DD')}&branchId=${Session.get('currentBranch')}`;
    },
    receiveItemBalance(){
        return `/pos/report/receiveItemBalance?asDate=${moment().endOf('days').format('YYYY-MM-DD')}&branchId=${Session.get('currentBranch')}`;
    }
});