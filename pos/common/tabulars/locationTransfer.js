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
import {LocationTransfers} from '../../imports/api/collections/locationTransfer';

// Page
Meteor.isClient && require('../../imports/ui/pages/locationTransfer.html');

tabularOpts.name = 'pos.locationTransfer';
tabularOpts.collection = LocationTransfers;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_locationTransferAction},
    {data: "_id", title: "ID"},
    {
        data: "locationTransferDate",
        title: "Date",
        render: function (val, type, doc) {
            return moment(val).format('YYYY-MM-DD');
        }
    },
    {
        data: "total",
        title: "Total",
        render: function(val) {
            return numeral(val).format('0,0.00');
        }
    },
    {data: "des", title: "Description"},
    {
        data: "_fromBranch",
        title: "From Branch",
        render: function(val) {
            return `${val.khName}(${_.capitalize(val.enName)})`;
        }
    },{
        data: "_toBranch",
        title: "To Branch",
        render: function(val) {
            return `${val.khName}(${_.capitalize(val.enName)})`;
        }
    },
    {
        data: "_fromStockLocation.name",
        title: "From Stock",
    },{
        data: "_toStockLocation.name",
        title: "To Stock",
    },
    {
        data: "status",
        title: "Status",
        render: function(val) {
            if(val == 'active') {
                return `<span class="label label-info">${val}</span>`;
            }else if (val == 'declined') {
                return `<span class="label label-danger">${val}</span>`;
            }
            return `<span class="label label-success">${val}</span>`;
        }
    },
    //{
    //    data: "_vendor",
    //    title: "Vendor Info",
    //    render: function (val, type, doc) {
    //        return JSON.stringify(val, null, ' ');
    //    }
    //}
];
tabularOpts.extraFields = ['toUserId', 'fromUserId'];
export const LocationTransferTabular = new Tabular.Table(tabularOpts);
