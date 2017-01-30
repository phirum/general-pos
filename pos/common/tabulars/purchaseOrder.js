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
import {PurchaseOrder} from '../../imports/api/collections/purchaseOrder.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/purchaseOrder.html');

tabularOpts.name = 'pos.purchaseOrder';
tabularOpts.collection = PurchaseOrder;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_purchaseOrderAction},
    {data: "_id", title: "ID"},
    {
        data: "purchaseOrderDate",
        title: "Date",
        render: function (val, type, doc) {
            return moment(val).format('YYYY-MM-DD');
        }
    },
    {data: "total", title: "Total"},
    {data: "des", title: "Description"},
    {data: "vendorId", title: "Vendor ID"},
    //{
    //    data: "_customer",
    //    title: "Customer Info",
    //    render: function (val, type, doc) {
    //        return JSON.stringify(val, null, ' ');
    //    }
    //}
];
export const PurchaseOrderTabular = new Tabular.Table(tabularOpts);
