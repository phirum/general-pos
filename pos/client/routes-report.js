import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {FlowRouterTitle} from 'meteor/ostrio:flow-router-title';
import 'meteor/arillo:flow-router-helpers';
import 'meteor/zimme:active-route';
import 'meteor/theara:flow-router-breadcrumb';

// Lib
import {__} from '../../core/common/libs/tapi18n-callback-helper.js';

// Layout
import {Layout} from '../../core/client/libs/render-layout.js';
import '../../core/imports/ui/layouts/report/index.html';

// Group
let PosRoutes = FlowRouter.group({
    prefix: '/pos',
    title: "Simple POS",
    titlePrefix: 'Simple POS > ',
    subscriptions: function (params, queryParams) {
//     this.register('files', Meteor.subscribe('files'));
    }
});

// Customer list
import '../imports/ui/reports/customer.js';
PosRoutes.route('/customer-report', {
    name: 'pos.customerReport',
    title: __('pos.customerReport.title'),
    action: function (params, queryParams) {
        Layout.main('Pos_customerReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('pos.customerReport.title'),
        icon: 'users',
        parent: 'pos.home'
    }
});

PosRoutes.route('/customer-report-gen', {
    name: 'pos.customerReportGen',
    title: __('pos.customerReport.title'),
    action: function (params, queryParams) {
        Layout.report('Pos_customerReportGen');
    }
});




PosRoutes.route('/order-report-gen', {
    name: 'pos.orderReportGen',
    title: __('pos.orderReport.title'),
    action: function (params, queryParams) {
        Layout.report('Pos_orderReportGen');
    }
});
//main report
import '../imports/ui/reports/main';
PosRoutes.route('/report', {
    name: 'pos.mainReport',
    title: 'Main Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_mainReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Main Report',
        // icon: 'cart-plus',
        parent: 'pos.home'
    }
});

import '../imports/ui/reports/invoice';
PosRoutes.route('/report/invoice', {
    name: 'pos.invoiceReport',
    title: 'Total Sale',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_invoiceReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Total Sale',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/invoiceByCustomer';
PosRoutes.route('/report/invoiceByCustomer', {
    name: 'pos.invoiceByCustomerReport',
    title: 'Sale by Customer Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_invoiceByCustomerReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Sale by Customer Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/invoiceByItem';
PosRoutes.route('/report/invoiceByItemReport', {
    name: 'pos.invoiceByItemReport',
    title: 'Sale by Item Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_invoiceByItemReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Sale by Item Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});
import '../imports/ui/reports/billByItem';
PosRoutes.route('/report/billByItemReport', {
    name: 'pos.billByItemReport',
    title: 'Bill By Item Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_billByItemReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Bill By Item Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/payment';
PosRoutes.route('/report/payment', {
    name: 'pos.paymentReport',
    title: 'Receive Payment Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_paymentReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Receive Payment Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/stockBalance';
PosRoutes.route('/report/stockBalance', {
    name: 'pos.paymentReport',
    title: 'Stock Ending',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_stockBalanceReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Stock Ending',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});


import '../imports/ui/reports/locationTransfer';
PosRoutes.route('/report/locationTransfer', {
    name: 'pos.locationTransferReport',
    title: 'Stock Transfer',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_locationTransferReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Stock Transfer',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/ringPullTransfer';
PosRoutes.route('/report/ringPullTransfer', {
    name: 'pos.ringPullTransferReport',
    title: 'Ring Pull Transfer Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_ringPullTransferReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Ring Pull Transfer Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/billReport';
PosRoutes.route('/report/billReport', {
    name: 'pos.billReport',
    title: 'Bill Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_billReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Bill Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/billByVendor';
PosRoutes.route('/report/billByVendorReport', {
    name: 'pos.billByVendorReport',
    title: 'Bill By Vendor Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_billByVendorReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Bill By Vendor Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/prepaidOrderReport';
PosRoutes.route('/report/prepaidOrderReport', {
    name: 'pos.prepaidOrderReport',
    title: 'Prepaid Order Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_prepaidOrderReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Prepaid Order Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/exchangeRingPull';
PosRoutes.route('/report/exchangeRingPullReport', {
    name: 'pos.exchangeRingPullReport',
    title: 'Ring Pull Exchange  Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_exchangeRingPullReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Ring Pull Exchange  Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});
import '../imports/ui/reports/lendingStockReport';
PosRoutes.route('/report/lendingStockReport', {
    name: 'pos.lendingStockReport',
    title: 'Stock Borrow',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_lendingStockReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Stock Borrow',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});
import '../imports/ui/reports/companyExchangeRingPullReport';
PosRoutes.route('/report/companyExchangeRingPullReport', {
    name: 'pos.companyExchangeRingPullReport',
    title: 'Ring Pull to KHB',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_companyExchangeRingPullReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Company Ring Pull Exchange  Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/exchangeGratis';
PosRoutes.route('/report/exchangeGratisReport', {
    name: 'pos.exchangeGratisReport',
    title: 'Exchange Gratis Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_exchangeGratisReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Exchange Gratis Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/saleOrderReport';
PosRoutes.route('/report/saleOrderReport', {
    name: 'pos.saleOrderReport',
    title: 'Sale Order Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_saleOrderReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Sale Order Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/groupReport';
PosRoutes.route('/report/groupReport', {
    name: 'pos.groupReport',
    title: 'Group Total Sale',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_groupReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Group Total Sale',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/groupBillReport';
PosRoutes.route('/report/groupBillReport', {
    name: 'pos.groupBillReport',
    title: 'Group Bill Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_groupBillReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Group Bill Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/termCustomerBalance';
PosRoutes.route('/report/termCustomerBalance', {
    name: 'pos.termCustomerBalance',
    title: 'Unpaid by Customer',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_termCustomerBalance');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Unpaid by Customer',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});
import '../imports/ui/reports/groupCustomerBalance';
PosRoutes.route('/report/groupCustomerBalance', {
    name: 'pos.groupCustomerBalance',
    title: 'Group Customer Balance Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_groupCustomerBalance');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Group Customer Balance Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});
import '../imports/ui/reports/receiveItemSummary';
PosRoutes.route('/report/receiveItemSummary', {
    name: 'pos.receiveItemSummary',
    title: 'Receive Item Summary',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_receiveItemSummary');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Receive Item Summary Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});
import '../imports/ui/reports/exchangeRingPullStockBalance';
PosRoutes.route('/report/exchangeRingPullStockBalance', {
    name: 'pos.exchangeRingPullStockBalanceReport',
    title: 'Ring Pull Exchange Ending',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_exchangeRingPullStockBalance');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Ring Pull Exchange Ending',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/transferMoneyReport';
PosRoutes.route('/report/transferMoneyReport', {
    name: 'pos.transferMoneyReport',
    title: 'Transfer Money Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_transferMoneyReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Transfer Money Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});
import '../imports/ui/reports/unpaidInvoiceOverdue';
PosRoutes.route('/report/unpaidInvoiceOverdue', {
    name: 'pos.unpaidInvoiceOverdue',
    title: 'Unpaid Invoice Overdue',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_unpaidInvoiceOverdue');
    },
    breadcrumb: {
        title: 'Unpaid Invoice Overdue',
        icon: '',
        parent: 'pos.home'
    }
});
import '../imports/ui/reports/unpaidInvoiceOverdue';
PosRoutes.route('/report/unpaidInvoiceOverdue', {
    name: 'pos.unpaidInvoiceOverdue',
    title: 'Unpaid Invoice Overdue',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_unpaidInvoiceOverdue');
    },
    breadcrumb: {
        title: 'Unpaid Invoice Overdue',
        icon: '',
        parent: 'pos.home'
    }
});

import '../imports/ui/reports/unpaidGroupInvoiceOverdue';
PosRoutes.route('/report/unpaidGroupInvoiceOverdue', {
    name: 'pos.unpaidGroupInvoiceOverdue',
    title: 'Unpaid Group Invoice Overdue',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_unpaidGroupInvoiceOverdue');
    },
    breadcrumb: {
        title: 'Unpaid Group Invoice Overdue',
        icon: '',
        parent: 'pos.home'
    }
});
import '../imports/ui/reports/prepaidOrderDetail';
PosRoutes.route('/report/prepaid-order-detail', {
    name: 'pos.prepaidOrderDetail',
    title: 'Prepaid Order Detail',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_prepaidOrderDetail');
    },
    breadcrumb: {
        title: 'Prepaid Order Detail',
        icon: '',
        parent: 'pos.home'
    }
});
import '../imports/ui/reports/customerDebtTracking';
PosRoutes.route('/report/customer-debt-tracking', {
    name: 'pos.customerDebtTracking',
    title: 'Customer Debt Tracking Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_customerDebtTracking');
    },
    breadcrumb: {
        title: 'Customer Debt Tracking',
        icon: '',
        parent: 'pos.home'
    }
});
import '../imports/ui/reports/customerTotalCredit';
PosRoutes.route('/report/customer-total-credit', {
    name: 'pos.customerTotalCredit',
    title: 'Total Credit',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_customerTotalCredit');
    },
    breadcrumb: {
        title: 'Total Credit',
        icon: '',
        parent: 'pos.home'
    }
});
import '../imports/ui/reports/stockDetail';
PosRoutes.route('/report/stockDetail', {
    name: 'pos.stockDetail',
    title: 'Stock Detail',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_stockDetailReport');
    },
    breadcrumb: {
        title: 'Stock Detail',
        icon: '',
        parent: 'pos.home'
    }
});

import '../imports/ui/reports/customerHistory';
PosRoutes.route('/report/customerHistory', {
    name: 'pos.customerHistory',
    title: 'Customer History',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_customerHistory');
    },
    breadcrumb: {
        title: 'Customer History',
        icon: '',
        parent: 'pos.home'
    }
});

import '../imports/ui/reports/ringpullDetail';
PosRoutes.route('/report/ringpullDetail', {
    name: 'pos.ringpullDetailReport',
    title: 'RingPull Detail Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_ringpullDetailReport');
    },
    breadcrumb: {
        title: 'RingPull Detail Report',
        icon: '',
        parent: 'pos.home'
    }
});

import '../imports/ui/reports/ringPullSummary';
PosRoutes.route('/report/ringpullSummary', {
    name: 'pos.ringPullSummaryReport',
    title: 'RingPull Summary Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_ringPullSummaryReport');
    },
    breadcrumb: {
        title: 'RingPull Summary Report',
        icon: '',
        parent: 'pos.home'
    }
});

import '../imports/ui/reports/prepaidOrderBalance';
PosRoutes.route('/report/prepaid-order-balance', {
    name: 'pos.prepaidOrderBalanceReport',
    title: 'Prepaid Order Balance Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_prepaidOrderBalance');
    },
    breadcrumb: {
        title: 'Prepaid Order Balance Report',
        icon: '',
        parent: 'pos.home'
    }
});

import '../imports/ui/reports/payBill';
PosRoutes.route('/report/payBill', {
    name: 'pos.payBillReport',
    title: 'Paybill Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_payBillReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Paybill Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/vendorBalance';
PosRoutes.route('/report/vendor-balance-summary', {
    name: 'pos.vendorBalanceSummary',
    title: 'Vendor Balance Summary Report',
    action: function (params, queryParams) {
        Layout.customReportLayout('pos_vendorBalanceSummaryReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Vendor Balance Summary Report',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});

import '../imports/ui/reports/receiveItemBalance';
PosRoutes.route('/report/receiveItemBalance', {
    name: 'pos.receiveItemBalance',
    title: 'Receive Item Balance',
    action: function (params, queryParams) {
        Layout.customReportLayout('Pos_receiveItemBalanceReport');
    },
    breadcrumb:{
        // params:['vendorId'],
        title: 'Receive Item Balance',
        // icon: 'cart-plus',
        parent: 'pos.mainReport'
    }
});