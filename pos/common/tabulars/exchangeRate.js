import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {Template} from 'meteor/templating';
import {Tabular} from 'meteor/aldeed:tabular';
import {EJSON} from 'meteor/ejson';
import {moment} from 'meteor/momentjs:moment';
import {_} from 'meteor/erasaur:meteor-lodash';
import {numeral} from 'meteor/numeral:numeral';
import {lightbox} from 'meteor/theara:lightbox-helpers';
//tmp collection
import {balanceTmpCollection} from '../../imports/api/collections/tmpCollection';
// Lib
import {tabularOpts} from '../../../core/common/libs/tabular-opts.js';

// Collection
import {ExchangeRates} from '../../imports/api/collections/exchangeRate.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/exchangeRate.html');

tabularOpts.name = 'pos.exchangeRate';
tabularOpts.collection = ExchangeRates;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_exchangeRateAction},
    {data: "_id", title: "ID"},
    {data: "base", title: "Base Currency"},
    {data: "symbol", title: "Symbol"},
    {
        title: "Rates",
        render(val, type, doc){
            return JSON.stringify(doc.rates);
        }
    },
];
tabularOpts.extraFields = ['rates'];
export const ExchangeRateTabular = new Tabular.Table(tabularOpts);
