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
import {TargetItem} from '../../imports/api/collections/targetItem.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/targetItem.html');

tabularOpts.name = 'pos.targetItemTabular';
tabularOpts.collection = TargetItem;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_targetItemAction},
    {data: "_item.name", title: "Item"},
    {
        data: "startDate", title: "Start Date",
        render: function (val) {
            return moment(val).format('YYYY/MM');
        }
    },
    {
        data: "endDate", title: "End Date",
        render: function (val) {
            return moment(val).format('YYYY/MM')
        }
    },
    {
        data: "amount", title: "Amount"
    },
    {data: "description", title: 'Description'}
];
tabularOpts.extraFields = ["itemId", "_id"];
export const TargetItemTabular = new Tabular.Table(tabularOpts);
