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
import {Units} from '../../imports/api/collections/units.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/unit.html');

tabularOpts.name = 'pos.unit';
tabularOpts.collection = Units;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_unitAction},
    {data: "_id", title: "ID"},
    {data: "name", title: "Name"},
    {data: "description", title: 'Description'}
];
export const UnitTabular = new Tabular.Table(tabularOpts);
