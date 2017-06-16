import {Branch} from '../../../core/imports/api/collections/branch';
import ClosingStock from "../../imports/api/libs/closingStockBalance";
Meteor.methods({
    fetchAllBranches(){
        return Branch.find({}).fetch();
    },
    testClosingStock(){
        ClosingStock.generateClosingStockBalance();
    }
});