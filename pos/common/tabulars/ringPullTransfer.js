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
import {RingPullTransfers} from '../../imports/api/collections/ringPullTransfer.js';
import {CustomerNullCollection} from '../../imports/api/collections/tmpCollection';
// Page
Meteor.isClient && require('../../imports/ui/pages/ringPullTransfer.html');

tabularOpts.name = 'pos.ringPullTransfer';
tabularOpts.collection = RingPullTransfers;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_ringPullTransferAction},
    {data: "_id", title: "ID"},
    {
        data: "ringPullTransferDate",
        title: "Date",
        render: function (val, type, doc) {
            return moment(val).format('YYYY-MM-DD');
        }
    },
    {
        data: "total",
        title: "Total",
        render: function (val) {
            return numeral(val).format('0,0.00');
        }
    },
    {
        data: "_fromBranch",
        title: "From Branch",
        render: function (val) {
            return `${val.khName}(${_.capitalize(val.enName)})`;
        }
    },
    {
        data: "_toBranch",
        title: "To Branch",
        render: function (val) {
            return `${val.khName}(${_.capitalize(val.enName)})`;
        }
    },
    {data: "des", title: "Description"},
    {
        data: "status",
        title: "Status",
        render: function (val) {
            if (val == 'active') {
                return `<span class="label label-info">${val}</span>`;
            } else if (val == 'declined') {
                return `<span class="label label-danger">${val}</span>`;
            }
            return `<span class="label label-success">${val}</span>`;
        }
    },
    //{
    //    data: "_customer",
    //    title: "Customer Info",
    //    render: function (val, type, doc) {
    //        return JSON.stringify(val, null, ' ');
    //    }
    //}
];
tabularOpts.extraFields = ['items', 'fromBranchId', 'toBranchId', 'stockLocationId', 'toUserId', 'fromUserId'];
export const RingPullTransferTabular = new Tabular.Table(tabularOpts);
