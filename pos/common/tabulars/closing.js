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
import {Closing} from '../../imports/api/collections/closing.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/closing.html');

tabularOpts.name = 'pos.closing';
tabularOpts.collection = Closing;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Pos_closingAction},
    {
        data: "closingDate", 
        title: "Closing Date",
        render: function(val){
            return moment(val).format('DD/MM/YYYY')
        }
    },
    {data: "description", title: "Description"},
];
export const ClosingTabular = new Tabular.Table(tabularOpts);
