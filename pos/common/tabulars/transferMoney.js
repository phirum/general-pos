import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
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
import {TransferMoney} from '../../imports/api/collections/transferMoney.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/transferMoney.html');

tabularOpts.name = 'pos.transferMoneyTabular';
tabularOpts.collection = TransferMoney;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_transferMoneyAction},
    {data: "_id", title: "ID"},
    {
        data: "transferMoneyDate",
        title: "Transfer Money Date",
        render:function(val){
            return moment(val).format('YYYY-MM-DD HH:mm:ss');
        }
    },
    {
        data: "transferAmount",
        title: "Transfer Amount",
        render: function(val) {
            return numeral(val).format('0,0.00');
        }
    },
    {
        data: "_fromBranch",
        title: "From Branch",
        render: function(val){
            return `${val.khName}(${val.enName})`;
        }
    },
    {
        data: "_toBranch",
        title: "From Branch",
        render: function(val){
            return `${val.khName}(${val.enName})`;
        }
    },
    {
        data: "status",
        title: "Status",
        render: function(val) {
            if(val == 'active') {
                return `<span class="label label-info">${_.capitalize(val)}</span>`;
            }else if(val == 'declined') {
                return `<span class="label label-danger">${_.capitalize(val)}</span>`;
            }
            return `<span class="label label-success">${_.capitalize(val)}</span>`
        }
    }
    // {data: "startQty", title: "Start Qty"
    // },
    // {data: "endQty", title: "End Qty"
    // },
    // {
    //     data: "price", title: "Price"
    // },{
    //     data: "commission", title: "Commission"
    // },
    // {data: "description", title: 'Description'}
];
tabularOpts.extraFields = ["pending",,"_toUser","_fromUser","fromBranchId","_id", "toBranchId"];
export const TransferMoneyTabular = new Tabular.Table(tabularOpts);
