import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {Setting} from '../../../../core/imports/api/collections/setting';

import {CloseChartAccount} from '../../../imports/api/collections/closeChartAccount';
import {CloseChartAccountPerMonth} from '../../../imports/api/collections/closeChartAccountPerMonth';
import {ChartAccount} from '../../../imports/api/collections/chartAccount';
import {SpaceChar} from '../../../common/configs/space';

Meteor.methods({
    acc_cashFlow: function (params) {
        if (!this.isSimulation) {
            var data = {
                title: {},
                header: {},
                content: [{
                    index: 'No Result'
                }],
                footer: {}
            };

            var date = s.words(params.date, ' - ');
            var fDate = moment(date[0], 'DD/MM/YYYY').toDate();
            var tDate = moment(date[1], 'DD/MM/YYYY').add(1, 'days').toDate();

            var startYear = moment(fDate).year();
            var startDate = moment('01-01-' + startYear, "DD/MM/YYYY").toDate();

            /****** Title *****/
            data.title = Company.findOne();

            /****** Header *****/
            data.header = params;
            /****** Content *****/


            var baseCurrency=Setting.findOne().baseCurrency;
            var content = '<table class="report-content" border="1"><thead class="report-content-header"><tr><th>Cash Flow</th><th>Jan</th><th>Feb</th><th>Mar</th><th>Apr</th><th>May</th><th>Jun</th><th>Jul</th><th>Aug</th><th>Sep</th><th>Oct</th><th>Nov</th><th>Dec</th></tr></thead><tbody class="report-content-body">';

            var operatingList = ChartAccount.find({accountTypeId: {$in: ["10","20"]}}).fetch();
            var investmentList = ChartAccount.find({accountTypeId: {$in: ["11"]}}).fetch();
            var financingList = ChartAccount.find().fetch();

            var selector = {};
            var selectorLastYear={};
            if(params.branchId!="All"){
                selector.branchId=params.branchId;
            }

            if(params.currencyId!="All"){
                selector.currencyId=params.currencyId;
            }



            content+="<tr><td><b>Operating Activities</b></td><td colspan='12'></td><tr>";
            operatingList.forEach(function (acc) {
                selector.closeChartAccountId = acc._id;
                content += "<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;"+acc.name+"</td>";



                var i = 1;
                for (i; i <= 12; i++) {

                    let monthNumber = s.pad(i, 2, "0");
                    selector.month = monthNumber;
                    selector.year = "2016";


                    var operatingActivities = Meteor.call('getMonthlyAccount',selector,params.exchangeDate,baseCurrency);

                    if (operatingActivities) {
                        content += "<td>"+operatingActivities+"</td>";
                    } else {
                        content += "<td>0</td>";
                    }
                }
            })
            content+="<tr><td><b>Net Cash Flow From Operating Activities</b></td><td colspan='12'></td><tr>";

            content+="</tr></tbody></table>";



            data.content=content;
            return data;
        }
    },

    getMonthlyAccount: function (selector,exchangeId,baseCurrency) {
        var datas = CloseChartAccountPerMonth.find(selector).fetch();

        var total=0;
        datas.forEach(function (obj) {
            if (obj.value != 0) {
                var re = Meteor.call('exchange', obj.currencyId, baseCurrency,
                    obj.value, exchangeId);
                total+=re;
            }
        });
        return total;
    }
});

function compare(a, b) {
    if (a.code < b.code) {
        return -1;
    } else if (a.code > b.code) {
        return 1;
    } else {
        return 0;
    }
}
