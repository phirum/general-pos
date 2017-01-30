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
import {RequirePassword} from '../../imports/api/collections/requirePassword.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/requirePassword.html');

tabularOpts.name = 'pos.requirePassword';
tabularOpts.collection = RequirePassword;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_requirePasswordAction},
    {data: "_id", title: "ID"},
    {data: "password", title: "Password"},
    {data: "invoiceForm", title: "Invoice Form"},
    {data: "saleOrderForm", title: "Sale Order Form"},
    {data: "branchId", title: "Branch"},
   // {data: "description", title: "Description"}
];
export const RequirePasswordTabular = new Tabular.Table(tabularOpts);
