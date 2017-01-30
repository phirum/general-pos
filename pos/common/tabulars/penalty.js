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
import {Penalty} from '../../imports/api/collections/penalty.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/penalty.html');

tabularOpts.name = 'pos.penalty';
tabularOpts.collection = Penalty;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_penaltyAction},
    {data: "_id", title: "ID"},
    {data: "rate", title: "Rate(%)"},
   // {data: "description", title: "Description"}
];
//tabularOpts.extraFields=['_parent'];
export const PenaltyTabular = new Tabular.Table(tabularOpts);
