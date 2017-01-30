import 'meteor/theara:collection-cache';

// Collection
import {RingPullTransfers} from '../../imports/api/collections/ringPullTransfer.js';
import {Branch} from '../../../core/imports/api/collections/branch.js';
import {StockLocations} from '../../imports/api/collections/stockLocation.js';
RingPullTransfers.cacheTimestamp();
// RingPullTransfers.cacheDoc('fromUser', Meteor.users, ['username'], 'fromUserId');
// RingPullTransfers.cacheDoc('toUser', Meteor.users, ['username'], 'toUserId');
RingPullTransfers.cacheDoc('fromBranch', Branch, ['enName','khName'],'fromBranchId');
RingPullTransfers.cacheDoc('toBranch', Branch, ['enName','khName'],'toBranchId');
RingPullTransfers.cacheDoc('stockLocation', StockLocations, ['name']);