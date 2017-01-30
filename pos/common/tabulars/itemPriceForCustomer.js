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
import {ItemPriceForCustomers} from '../../imports/api/collections/itemPriceForCustomer.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/itemPriceForCustomer.html');

tabularOpts.name = 'pos.itemPriceForCustomerTabular';
tabularOpts.collection = ItemPriceForCustomers;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_itemPriceForCustomerAction},
    {data: "_customer.name", title: "Customer"},
    {data: "description", title: 'Description'}
];
tabularOpts.extraFields = ["_id", "items", "customerId"]
export const ItemPriceForCustomerTabular = new Tabular.Table(tabularOpts);
