import {Vendors} from '../../imports/api/collections/vendor.js';

// Lib
import './_init.js';

Vendors.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
Vendors.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
Vendors.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
