import {ItemPriceForCustomers} from '../../imports/api/collections/itemPriceForCustomer.js';

// Lib
import './_init.js';

ItemPriceForCustomers.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
ItemPriceForCustomers.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
ItemPriceForCustomers.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
