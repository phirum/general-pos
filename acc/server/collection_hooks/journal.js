import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {round2} from 'meteor/theara:round2';



// Collection
import {Journal} from '../../imports/api/collections/journal';
import {ConfigDep} from '../../imports/api/collections/configDep';
import {ChartAccount} from '../../imports/api/collections/chartAccount';
import {DepExpList} from '../../imports/api/collections/depExpList';
import {FixAssetDep} from '../../imports/api/collections/fixAssetDep';



Journal.before.insert(function (userId, doc) {
    var depType = ConfigDep.findOne();
    var transaction = [];
    _.each(doc.transaction, function (obj) {
        if (!_.isNull(obj)) {
            var accountId = obj.account.split('|');
            var account = ChartAccount.findOne({code: accountId[0].replace(/\s+/g, '')}, {
                fields: {
                    name: 1,
                    accountTypeId: 1,
                    code: 1,
                    level: 1,
                    parentId: 1
                }
            });
            obj.accountDoc = account;
            transaction.push(obj);
        }
    });
    doc.transaction = transaction;
    var lenArray = doc.transaction.length;
    var date = moment(doc.journalDate, "DD/MM/YYYY").format("YYMM");
    var prefix = doc.branchId + "-" + date;

    doc._id = doc.idGiven != undefined ? doc.idGiven : idGenerator.genWithPrefix(Journal, prefix, 6);

    doc.splitAccount = lenArray > 2 ? doc._id : 0;

    var curMonth = moment(doc.journalDate).format("MM");

    // Check currency
    let _round = {
        type: 'general',
        precision: 0 // KHR
    };

    switch (doc.currencyId) {
        case 'USD':
            _round.precision = 2;
            break;
        case 'THB':
            _round.precision = 0;
            break;
    }


    if (doc.transactionAsset != undefined) {
        doc.transactionAsset.forEach(function (obj) {

            //Straight Line Method
            if (depType.depType == "01: Straight Line") {
                var selectorFixAssetExpList = {};
                selectorFixAssetExpList.date = doc.journalDate;
                selectorFixAssetExpList.branchId = doc.branchId;
                selectorFixAssetExpList.currencyId = doc.currencyId;
                selectorFixAssetExpList.journalId = doc._id;

                selectorFixAssetExpList.code = obj.code;
                selectorFixAssetExpList.description = obj.description;
                selectorFixAssetExpList.percent = obj.percent;
                selectorFixAssetExpList.estSalvage = obj.estSalvage;

                selectorFixAssetExpList.account = obj.account;
                selectorFixAssetExpList.amount = obj.value;
                selectorFixAssetExpList.life = obj.life;


                var transactionList = [];

                let depPerYear = round2(((obj.value - obj.estSalvage) / obj.life ), _round.precision, _round.type);

                if (curMonth != "12") {
                    for (let i = 1; i <= obj.life + 1; i++) {
                        if (i == 1 || i == obj.life + 1) {
                            let maxMonth = i == 1 ? 12 - parseInt(curMonth) : parseInt(curMonth);
                            transactionList.push({
                                year: i,
                                perMonth: round2(depPerYear / 12, _round.precision, _round.type),
                                perYear: round2((depPerYear / 12) * maxMonth, _round.precision, _round.type),
                                month: 0,
                                maxMonth: maxMonth,
                                status: false
                            })
                        } else {
                            transactionList.push({
                                year: i,
                                perMonth: round2(depPerYear / 12, _round.precision, _round.type),
                                perYear: depPerYear,
                                month: 0,
                                maxMonth: 12,
                                status: false
                            })
                        }

                    }
                } else {
                    for (let i = 1; i <= obj.life; i++) {
                        transactionList.push({
                            year: i,
                            perMonth: round2(depPerYear / 12, _round.precision, _round.type),
                            perYear: depPerYear,
                            month: 0,
                            maxMonth: 12,
                            status: false
                        })
                    }
                }


                selectorFixAssetExpList.transactionAsset = transactionList;

                DepExpList.insert(selectorFixAssetExpList);
            } else if (depType.depType == "02: Sum Of Year Digits") {
                var selectorFixAssetExpList = {};
                selectorFixAssetExpList.date = doc.journalDate;
                selectorFixAssetExpList.branchId = doc.branchId;
                selectorFixAssetExpList.currencyId = doc.currencyId;
                selectorFixAssetExpList.journalId = doc._id;

                selectorFixAssetExpList.code = obj.code;
                selectorFixAssetExpList.description = obj.description;
                selectorFixAssetExpList.percent = obj.percent;
                selectorFixAssetExpList.estSalvage = obj.estSalvage;

                selectorFixAssetExpList.account = obj.account;
                selectorFixAssetExpList.amount = obj.value;
                selectorFixAssetExpList.life = obj.life;

                var numYear = 0;
                for (let i = 1; i <= obj.life; i++) {
                    numYear += i;
                }

                var depreAmount = round2(obj.value - obj.estSalvage, _round.precision, _round.type);
                var y = 1;
                var transactionList = [];
                for (let i = obj.life; i > 0; i--) {
                    let depPerYear = round2((i / numYear) * depreAmount, _round.precision, _round.type);
                    transactionList.push({
                        year: y,
                        perMonth: round2(depPerYear / 12, _round.precision, _round.type),
                        perYear: depPerYear,
                        month: 0,
                        maxMonth: 12,
                        status: false
                    })
                    y++;
                }

                selectorFixAssetExpList.transactionAsset = transactionList;
                DepExpList.insert(selectorFixAssetExpList);
            } else if (depType.depType == "03: Declining Balance") {
                var selectorFixAssetExpList = {};
                selectorFixAssetExpList.date = doc.journalDate;
                selectorFixAssetExpList.branchId = doc.branchId;
                selectorFixAssetExpList.currencyId = doc.currencyId;
                selectorFixAssetExpList.journalId = doc._id;

                selectorFixAssetExpList.code = obj.code;
                selectorFixAssetExpList.description = obj.description;
                selectorFixAssetExpList.percent = obj.percent;
                selectorFixAssetExpList.estSalvage = obj.estSalvage;

                selectorFixAssetExpList.account = obj.account;
                selectorFixAssetExpList.amount = obj.value;
                selectorFixAssetExpList.life = obj.life;

                var value = obj.value;
                var transactionList = [];

                for (let i = 1; i <= obj.life; i++) {
                    let depPerYear = 0;
                    let maxMonth = (i == 1 || i == obj.life) && curMonth != 12 ? 12 - parseInt(curMonth) : 12;

                    if (i == obj.life) {
                        depPerYear = round2(obj.value - obj.estSalvage, _round.precision, _round.type);
                    } else {
                        depPerYear = round2(((obj.value - obj.estSalvage) * (obj.percent / 100) ), _round.precision, _round.type);

                    }

                    transactionList.push({
                        year: i,
                        perMonth: round2(depPerYear / maxMonth, _round.precision, _round.type),
                        perYear: depPerYear,
                        month: 0,
                        maxMonth: maxMonth,
                        status: false
                    })
                    obj.value -= depPerYear;

                }


                obj.value = value;
                selectorFixAssetExpList.transactionAsset = transactionList;
                DepExpList.insert(selectorFixAssetExpList);
            }

        })


        var selectorFixAssetDep = {};
        selectorFixAssetDep.date = doc.journalDate;
        selectorFixAssetDep.branchId = doc.branchId;
        selectorFixAssetDep.currencyId = doc.currencyId;
        selectorFixAssetDep.journalId = doc._id;
        selectorFixAssetDep.isDep = false;
        selectorFixAssetDep.transactionAsset = doc.transactionAsset;

        FixAssetDep.insert(selectorFixAssetDep);
    }


});
Journal.before.update(function (userId, doc, fieldNames, modifier, options) {
    var depType = ConfigDep.findOne();
    modifier.$set = modifier.$set || {};
    var transaction = [];
    _.each(modifier.$set.transaction, function (obj) {
        if (!_.isNull(obj)) {
            var accountId = obj.account.split('|');

            var account = ChartAccount.findOne({code: accountId[0].replace(/\s+/g, '')}, {
                fields: {
                    name: 1,
                    accountTypeId: 1,
                    code: 1,
                    level: 1,
                    parentId: 1
                }
            });
            obj.accountDoc = account;
            transaction.push(obj);
        }
    });


    // Check currency
    let _round = {
        type: 'general',
        precision: 0 // KHR
    };

    switch (modifier.$set.currencyId) {
        case 'USD':
            _round.precision = 2;
            break;
        case 'THB':
            _round.precision = 0;
            break;
    }

    modifier.$set.transaction = transaction;
    var curMonth = moment(modifier.$set.journalDate).format("MM");
    if (modifier.$set.transactionAsset != undefined) {

        FixAssetDep.remove({journalId: doc._id});
        DepExpList.remove({journalId: doc._id});


        modifier.$set.transactionAsset.forEach(function (obj) {
            if (depType.depType == "01: Straight Line") {
                var selectorFixAssetExpList = {};
                selectorFixAssetExpList.date = modifier.$set.journalDate;
                selectorFixAssetExpList.branchId = modifier.$set.branchId;
                selectorFixAssetExpList.currencyId = modifier.$set.currencyId;
                selectorFixAssetExpList.journalId = doc._id;
                selectorFixAssetExpList.life = obj.life;

                selectorFixAssetExpList.code = obj.code;
                selectorFixAssetExpList.description = obj.description;
                selectorFixAssetExpList.percent = obj.percent;
                selectorFixAssetExpList.estSalvage = obj.estSalvage;

                selectorFixAssetExpList.amount = obj.value;


                selectorFixAssetExpList.account = obj.account;

                var transactionList = [];
                let depPerYear = round2((obj.value - obj.estSalvage) / obj.life, _round.precision, _round.type);
                if (curMonth != "12") {
                    for (let i = 1; i <= obj.life + 1; i++) {
                        if (i == 1 || i == obj.life + 1) {
                            let maxMonth = i == 1 ? 12 - parseInt(curMonth) : parseInt(curMonth);
                            transactionList.push({
                                year: i,
                                perMonth: round2(depPerYear / 12, _round.precision, _round.type),
                                perYear: round2((depPerYear / 12) * maxMonth, _round.precision, _round.type),
                                month: 0,
                                maxMonth: maxMonth,
                                status: false
                            })
                        } else {
                            transactionList.push({
                                year: i,
                                perMonth: round2(depPerYear / 12, _round.precision, _round.type),
                                perYear: depPerYear,
                                month: 0,
                                maxMonth: 12,
                                status: false
                            })
                        }

                    }
                } else {
                    for (let i = 1; i <= obj.life; i++) {
                        transactionList.push({
                            year: i,
                            perMonth: round2(depPerYear / 12, _round.precision, _round.type),
                            perYear: depPerYear,
                            month: 0,
                            maxMonth: 12,
                            status: false
                        })
                    }
                }
                selectorFixAssetExpList.transactionAsset = transactionList;

                DepExpList.insert(selectorFixAssetExpList);
            } else if (depType.depType == "02: Sum Of Year Digits") {
                var selectorFixAssetExpList = {};
                selectorFixAssetExpList.date = modifier.$set.journalDate;
                selectorFixAssetExpList.branchId = modifier.$set.branchId;
                selectorFixAssetExpList.currencyId = modifier.$set.currencyId;
                selectorFixAssetExpList.journalId = doc._id;


                selectorFixAssetExpList.code = obj.code;
                selectorFixAssetExpList.description = obj.description;
                selectorFixAssetExpList.percent = obj.percent;
                selectorFixAssetExpList.estSalvage = obj.estSalvage;

                selectorFixAssetExpList.account = obj.account;
                selectorFixAssetExpList.amount = obj.value;
                selectorFixAssetExpList.life = obj.life;

                var numYear = 0;
                for (let i = 1; i <= obj.life; i++) {
                    numYear += i;
                }
                var depreAmount = obj.value - obj.estSalvage;

                var transactionList = [];
                var y = 1;
                for (let i = obj.life; i > 0; i--) {
                    let depPerYear = round2((i / numYear) * depreAmount, _round.precision, _round.type);
                    transactionList.push({
                        year: y,
                        perMonth: round2(depPerYear / 12, _round.precision, _round.type),
                        perYear: depPerYear,
                        month: 0,
                        maxMonth: 12,
                        status: false
                    })
                    y++;
                }

                selectorFixAssetExpList.transactionAsset = transactionList;
                DepExpList.insert(selectorFixAssetExpList);
            } else if (depType.depType == "03: Declining Balance") {
                var selectorFixAssetExpList = {};
                selectorFixAssetExpList.date = modifier.$set.journalDate;
                selectorFixAssetExpList.branchId = modifier.$set.branchId;
                selectorFixAssetExpList.currencyId = modifier.$set.currencyId;
                selectorFixAssetExpList.journalId = doc._id;


                selectorFixAssetExpList.code = obj.code;
                selectorFixAssetExpList.description = obj.description;
                selectorFixAssetExpList.percent = obj.percent;
                selectorFixAssetExpList.estSalvage = obj.estSalvage;

                selectorFixAssetExpList.account = obj.account;
                selectorFixAssetExpList.amount = obj.value;
                selectorFixAssetExpList.life = obj.life;


                var transactionList = [];
                var value = obj.value;


                for (let i = 1; i <= obj.life; i++) {
                    let depPerYear = 0;
                    let maxMonth = (i == 1 || i == obj.life) && curMonth != 12 ? 12 - parseInt(curMonth) : 12;

                    if (i == obj.life) {
                        depPerYear = round2(obj.value - obj.estSalvage, _round.precision, _round.type);
                    } else {
                        depPerYear = round2(((obj.value - obj.estSalvage) * (obj.percent / 100) ), _round.precision, _round.type);

                    }
                    transactionList.push({
                        year: i,
                        perMonth: round2(depPerYear / maxMonth, _round.precision, _round.type),
                        perYear: depPerYear,
                        month: 0,
                        maxMonth: maxMonth,
                        status: false
                    })
                    obj.value -= depPerYear;

                }


                obj.value = value;

                selectorFixAssetExpList.transactionAsset = transactionList;
                DepExpList.insert(selectorFixAssetExpList);
            }

        })

        var selectorFixAssetDep = {};
        selectorFixAssetDep.date = modifier.$set.journalDate;
        selectorFixAssetDep.branchId = modifier.$set.branchId;
        selectorFixAssetDep.currencyId = modifier.$set.currencyId;
        selectorFixAssetDep.journalId = doc._id;
        selectorFixAssetDep.transactionAsset = modifier.$set.transactionAsset;
        selectorFixAssetDep.isDep = false;


        FixAssetDep.insert(selectorFixAssetDep);
    } else {
        FixAssetDep.remove({journalId: doc._id});
        DepExpList.remove({journalId: doc._id});

        modifier.$set.transactionAsset = [];
    }
});
