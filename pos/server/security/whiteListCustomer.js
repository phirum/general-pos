import {WhiteListCustomer} from '../../imports/api/collections/whiteListCustomer.js';

// Lib
import './_init.js';

WhiteListCustomer.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
WhiteListCustomer.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
WhiteListCustomer.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
