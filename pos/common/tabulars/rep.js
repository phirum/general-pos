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
import {Reps} from '../../imports/api/collections/rep.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/rep.html');

tabularOpts.name = 'pos.rep';
tabularOpts.collection = Reps;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_repAction},
    {data: "_id", title: "ID"},
    {data: "name", title: "Name"},
    {data: "gender", title: "Gender"},
    {data: "telephone", title: "Telephone"},
    {data: "position", title: "Position"},
    {data: "email", title: "Email"}
];
tabularOpts.extraFields = ["status", "startDate", "salary", "address"]
export const RepTabular = new Tabular.Table(tabularOpts);
