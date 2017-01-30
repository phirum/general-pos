import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';
import {Tabular} from 'meteor/aldeed:tabular';
import {EJSON} from 'meteor/ejson';
import {moment} from 'meteor/momentjs:moment';
import {_} from 'meteor/erasaur:meteor-lodash';
import {numeral} from 'meteor/numeral:numeral';
import {lightbox} from 'meteor/theara:lightbox-helpers';

// Lib
import {tabularOpts} from '../../../core/common/libs/tabular-opts.js';

// Collection
import {PrepaidOrders} from '../../imports/api/collections/prepaidOrder.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/prepaidOrder.html');

tabularOpts.name = 'pos.prepaidOrder';
tabularOpts.collection = PrepaidOrders;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_prepaidOrderAction},
    {data: "_id", title: "ID"},
    {
        data: "prepaidOrderDate",
        title: "Date",
        render: function (val, type, doc) {
            return moment(val).format('YYYY-MM-DD');
        }
    },
    {data: "total", title: "Total"},
    {data: "sumRemainQty", title: "Remain QTY"},
    {data: "des", title: "Description"},
    {data: "voucherId", title: "Voucher"},
    {data: "vendorId", title: "Vendor ID"}
    //{
    //    data: "_vendor",
    //    title: "Vendor Info",
    //    render: function (val, type, doc) {
    //        return JSON.stringify(val, null, ' ');
    //    }
    //}
];
tabularOpts.extraFields = ['items'];
export const PrepaidOrderTabular = new Tabular.Table(tabularOpts);
