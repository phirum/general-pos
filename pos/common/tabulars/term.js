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
import {Terms} from '../../imports/api/collections/terms.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/term.html');

tabularOpts.name = 'pos.term';
tabularOpts.collection = Terms;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_termAction},
    {data: "_id", title: "ID"},
    {data: "name", title: "Name"},
    {data: "netDueIn", title: 'Net Due In'},
    {data: "discountIfPaidWithin", title: "Paid Within"},
    {data: "discountPercentages", title: 'Discount'}
];
export const termTabular = new Tabular.Table(tabularOpts);
