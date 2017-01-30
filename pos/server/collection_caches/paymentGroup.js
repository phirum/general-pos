import 'meteor/theara:collection-cache';

// Collection
import {PaymentGroups} from '../../imports/api/collections/paymentGroup';
PaymentGroups.cacheTimestamp();
