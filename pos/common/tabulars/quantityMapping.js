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
import {QuantityRangeMapping} from '../../imports/api/collections/quantityRangeMapping.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/quantityRangeMapping.html');

tabularOpts.name = 'pos.quantityRangeMappingTabular';
tabularOpts.collection = QuantityRangeMapping;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_quantityRangeMappingAction},
    {data: "_item.name", title: "Item"},
    {
        data: "startQty", title: "Start Qty"
    },
    {
        data: "endQty", title: "End Qty"
    },
    {
        data: "price", title: "Price"
    },
    {
        data: "commission", title: "Commission"
    },
    {data: "description", title: 'Description'}
];
tabularOpts.extraFields = ["itemId", "_id"];
export const QuantityMappingTabular = new Tabular.Table(tabularOpts);
