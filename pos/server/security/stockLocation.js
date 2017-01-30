import {StockLocations} from '../../imports/api/collections/stockLocation.js';

// Lib
import './_init.js';

StockLocations.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
StockLocations.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
StockLocations.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
