import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {Template} from 'meteor/templating';
import {Tabular} from 'meteor/aldeed:tabular';
import {EJSON} from 'meteor/ejson';
import {moment} from 'meteor/momentjs:moment';
import {_} from 'meteor/erasaur:meteor-lodash';
import {numeral} from 'meteor/numeral:numeral';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {tmpCollection} from '../../imports/api/collections/tmpCollection';
// Lib
import {tabularOpts} from '../../../core/common/libs/tabular-opts.js';

// Collection
import {PayBills} from '../../imports/api/collections/payBill.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/payBillTransaction.html');

tabularOpts.name = 'pos.payBillTransaction';
tabularOpts.collection = PayBills;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_payBillTransactionAction},
    {data: "_id", title: '#ID'},
    {data: "billId", title: "Bill ID"},
    {
        data: "billDate",
        title: "Date",
        render: function (val) {
            return moment(val).format('YYYY-MM-DD HH:mm')
        }
    },
    {
        data: "_vendor.name",
        title: "Vendor",
    },
    {
        data: "_staff.username",
        title: "Staff",
    },
    {
        data: "dueAmount",
        title: "Actual Due Amount",
        render: function (val, type, doc) {
            let recalDueAmountWithDiscount = val / (1 - (doc.discount / 100));
            return numeral(recalDueAmountWithDiscount).format('0,0.00');
        }
    },
    {data: "discount", title: "Discount(%)"},
    {
        data: "dueAmount",
        title: 'Due Amount',
        render: function (val) {
            return numeral(val).format('0,0.00');
        }
    },
    // {data: "discount", title: "Discount(%)"},
    {
        data: "paidAmount",
        title: "Paid Amount",
        render: function (val) {
            return numeral(val).format('0,0.00');
        }
    },
    {
        data: 'balanceAmount',
        title: "Balance Amount",
        render: function (val) {
            if (val > 0) {
                return `<span class="text-red">${numeral(val).format('0,0.00')}</span>`
            }
            return numeral(val).format('0,0.00');
        }
    },
    // {
    //     data: 'paymentType',
    //     title: 'Type',
    //     render: function(val) {
    //         if(val == 'term') {
    //             return `<span class="label label-primary">T</span>`;
    //         }
    //         return `<span class="label label-warning">G</span>`;
    //     }
    // },

    {
        data: 'status',
        title: 'Status',
        render: function (val) {
            if (val == 'closed') {
                return `<span class="label label-success">C</span>`
            }
            return `<span class="label label-danger">P</span>`
        }
    }

// {data: "description", title: "Description"}
]
;
tabularOpts.extraFields=['paymentType'];
export const PayBillTransactionListTabular = new Tabular.Table(tabularOpts);
