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
import {Categories} from '../../imports/api/collections/category.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/category.html');

tabularOpts.name = 'pos.category';
tabularOpts.collection = Categories;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_categoryAction},
    {data: "_id", title: "ID"},
    {data: "name", title: "Name"},
    {data: "parent", title: 'Category'},
    {data: "description", title: "Description"},
   // {data: "description", title: "Description"}
];
//tabularOpts.extraFields=['_parent'];
export const CategoryTabular = new Tabular.Table(tabularOpts);
