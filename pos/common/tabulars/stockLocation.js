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
import {StockLocations} from '../../imports/api/collections/stockLocation.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/stockLocation.html');

tabularOpts.name = 'pos.stockLocation';
tabularOpts.collection = StockLocations;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_stockLocationAction},
    {data: "_id", title: "ID"},
    {data: "name", title: "Name"},
    {data: "description", title: "Description"},
   // {data: "description", title: "Description"}
];
//tabularOpts.extraFields=['_parent'];
export const StockLocationTabular = new Tabular.Table(tabularOpts);
