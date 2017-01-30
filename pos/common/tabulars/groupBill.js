import {Meteor} from 'meteor/meteor';
import {Templet} from 'meteor/templating';
import {Tabular} from 'meteor/aldeed:tabular';
import {EJSON} from 'meteor/ejson';
import {moment} from 'meteor/momentjs:moment';
import {_} from 'meteor/erasaur:meteor-lodash';
import {numeral} from 'meteor/numeral:numeral';
import {lightbox} from 'meteor/theara:lightbox-helpers';

// Lib
import {tabularOpts} from '../../../core/common/libs/tabular-opts.js';

// Collection
import {GroupBill} from '../../imports/api/collections/groupBill.js';
import {tmpCollection} from '../../imports/api/collections/tmpCollection';
// Page
Meteor.isClient && require('../../imports/ui/pages/groupBill.html');

tabularOpts.name = 'pos.groupBillList';
tabularOpts.collection = GroupBill;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_groupBillAction},
    {data: "_id", title: "ID"},
    {
        data: "_vendor.name",
        title: "Vendor",
    },
    {
        data: "startDate",
        title: "Start Date",
        render: function (val) {
            return moment(val).format('YYYY-MM-DD HH:mm:ss');
        }
    },
    {
        data: "endDate",
        title: "End Date",
        render: function (val) {
            return moment(val).format('YYYY-MM-DD HH:mm:ss');
        }
    },
    {
        data: "dueDate",
        title: "Due Date",
        render: function (val) {
            return `<span class="text-red">${moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>`;
        }
    },
    {
        data: "status",
        title: "Status",
        render: function (val) {
            if (val == 'closed') {
                return `<span class="label label-success">C</span>`
            } else if (val == 'partial') {
                return `<span class="label label-danger">P</span>`
            }
            return `<span class="label label-info">A</span>`
        }
    },
    {
        data: "total",
        title: "Total",
        render: function (val) {
            return numeral(val).format('0,0.00');
        }
    }
    //}
];
tabularOpts.extraFields = ['invoices'];
export const GroupBillTabular = new Tabular.Table(tabularOpts);
