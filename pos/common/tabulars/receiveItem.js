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
import {ReceiveItems} from '../../imports/api/collections/receiveItem.js';
import {vendorBillCollection} from '../../imports/api/collections/tmpCollection';
// Page
Meteor.isClient && require('../../imports/ui/pages/receiveItem/receiveItem.html');

tabularOpts.name = 'pos.receiveItem';
tabularOpts.collection = ReceiveItems;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_receiveItemAction},
    {data: "_id", title: "ID"},
    {
        data: "receiveItemDate",
        title: "Date",
        render: function (val, type, doc) {
            return moment(val).format('YYYY-MM-DD HH:mm:ss');
        }
    },
    {data: "total", title: "Total"},
    {data: "des", title: "Description"},
    {
        data: "vendorId",
        title: "Vendor ID",
        render: function (val) {
            let vendor = vendorBillCollection.findOne(val);
            if (!vendor) {
                Meteor.call('getVendor', {vendorId: val}, function (err, result) {
                    vendorBillCollection.insert(result);
                })
            }
            try {
                return vendorBillCollection.findOne(val).name;
            } catch (e) {
            }
        }
    },
    // {data: "staffId", title: "Staff ID"},
    {data: "stockLocationId", title: "Stock Location"},
    {data: "type", title: "Receive Type"},
    {data: "status", title: "Status"},
    //{
    //    data: "_vendor",
    //    title: "Vendor Info",
    //    render: function (val, type, doc) {
    //        return JSON.stringify(val, null, ' ');
    //    }
    //}
];
tabularOpts.extraFields = ['staffId','items', 'dueDate', 'stockLocationId', 'repId', 'voucherId', 'type', 'prepaidOrderId', 'companyExchangeRingPullId','lendingStockId','exchangeGratisId', '_vendor','branchId'];
export const ReceiveItemTabular = new Tabular.Table(tabularOpts);
