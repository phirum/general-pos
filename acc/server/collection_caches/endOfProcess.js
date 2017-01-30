import 'meteor/theara:collection-cache';

// Collection
import {DateEndOfProcess} from '../../imports/api/collections/dateEndOfProcess';
import {NetInCome} from '../../imports/api/collections/netIncome';
import {CloseChartAccountPerMonth} from '../../imports/api/collections/closeChartAccountPerMonth';


DateEndOfProcess.cacheTimestamp();
DateEndOfProcess._ensureIndex({month: 1, year: 1, branchId: 1}, {unique: 1});
