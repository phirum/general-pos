import 'meteor/theara:collection-cache';

// Collection
import {LocationTransfers} from '../../imports/api/collections/locationTransfer.js';
import {StockLocations} from '../../imports/api/collections/stockLocation.js';
import {Branch} from '../../../core/imports/api/collections/branch.js';

LocationTransfers.cacheTimestamp();
// LocationTransfers.cacheDoc('fromUser', Meteor.users, ['username'], 'fromUserId');
// LocationTransfers.cacheDoc('toUser', Meteor.users, ['username'], 'toUserId');
LocationTransfers.cacheDoc('fromStockLocation', StockLocations, ['name'],'fromStockLocationId');
LocationTransfers.cacheDoc('toStockLocation', StockLocations, ['name'],'toStockLocationId');
LocationTransfers.cacheDoc('fromBranch', Branch, ['enName','khName'],'fromBranchId');
LocationTransfers.cacheDoc('toBranch', Branch, ['enName','khName'],'toBranchId');